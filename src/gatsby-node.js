const webpack = require("webpack")

function normalize(url) {
  return url.replace(/(https?:\/\/)|(\/)+/g, "$1$2")
}

function flattenMessages(nestedMessages, prefix = "") {
  return Object.keys(nestedMessages).reduce((messages, key) => {
    let value = nestedMessages[key]
    let prefixedKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === "string") {
      messages[prefixedKey] = value
    } else {
      Object.assign(messages, flattenMessages(value, prefixedKey))
    }

    return messages
  }, {})
}

exports.onCreateWebpackConfig = ({ actions, plugins }, pluginOptions) => {
  const { redirectComponent = null, languages, defaultLanguage } = pluginOptions
  if (!languages.includes(defaultLanguage)) {
    languages.push(defaultLanguage)
  }
  const regex = new RegExp(languages.map(l => l.split("-")[0]).join("|"))
  actions.setWebpackConfig({
    plugins: [
      plugins.define({
        GATSBY_INTL_REDIRECT_COMPONENT_PATH: JSON.stringify(redirectComponent),
      }),
      new webpack.ContextReplacementPlugin(
        /@formatjs[/\\]intl-relativetimeformat[/\\]dist[/\\]locale-data$/,
        regex
      ),
      new webpack.ContextReplacementPlugin(
        /@formatjs[/\\]intl-pluralrules[/\\]dist[/\\]locale-data$/,
        regex
      ),
    ],
  })
}

exports.onCreatePage = async ({ page, actions }, pluginOptions) => {
  //Exit if the page has already been processed.
  if (typeof page.context.intl === "object") {
    return
  }
  const { createPage, deletePage } = actions
  const {
    path = ".",
    languages = ["en"],
    defaultLanguage = "en",
    redirect = false,
  } = pluginOptions

  const getMessages = (path, language) => {
    try {
      // TODO load yaml here
      const messages = require(`${path}/${language}.json`)

      return flattenMessages(messages)
    } catch (error) {
      if (error.code === "MODULE_NOT_FOUND") {
        process.env.NODE_ENV !== "test" &&
          console.error(
            `[gatsby-plugin-intl] couldn't find file "${path}/${language}.json"`
          )
      }

      throw error
    }
  }

  // Return all languages slug for this page
  const getSlugs = path => {
    if (page.context.slugs) {
      return page.context.slugs
    }
    var slugs = {}
    languages.forEach(language => {
      var messages = getMessages(path, language)
      slugs[language] = normalize(
        "/" +
          page.path
            .split("/")
            .map(slug => messages[`${slug}.slug`] || slug)
            .join("/")
      )
    })
    return slugs
  }

  const generatePage = (routed, language) => {
    const messages = getMessages(path, language)
    let slugs = getSlugs(path)
    if (!routed && slugs[language].startsWith(`/${language}/`)) {
      return
    }
    let newPath
    if (page.path.match(/^\/?(nl|fr)(\/|$)/)) {
      newPath = page.path
      slugs = null
    } else {
      newPath = normalize(
        routed ? `/${language}${slugs[language]}` : `${slugs[language]}`
      )
    }
    return {
      ...page,
      path: newPath,
      context: {
        ...page.context,
        language,
        intl: {
          language,
          languages,
          slugs,
          messages,
          routed,
          originalPath: page.path,
          redirect,
          defaultLanguage,
        },
      },
    }
  }

  const newPage = generatePage(false, defaultLanguage)
  if (newPage) {
    deletePage(page)
    createPage(newPage)
  }

  if (page.context.language) {
    const localePage = generatePage(true, page.context.language)
    if (!localePage) {
      return
    }
    const regexp = new RegExp("/404/?$")
    if (regexp.test(localePage.path)) {
      localePage.matchPath = `/${page.context.language}/*`
    }
    createPage(localePage)
    return
  }

  languages.forEach(language => {
    const localePage = generatePage(true, language)
    if (!localePage) {
      return
    }
    const regexp = new RegExp("/404/?$")
    if (regexp.test(localePage.path)) {
      localePage.matchPath = `/${language}/*`
    }
    createPage(localePage)
  })
}
