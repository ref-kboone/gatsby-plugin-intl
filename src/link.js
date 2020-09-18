import React from "react"
import PropTypes from "prop-types"
import { Link as GatsbyLink, navigate as gatsbyNavigate } from "gatsby"
import { IntlContextConsumer } from "./intl-context"

const getLink = (language, to, routed, messages) => {
  const currentPage = to.replace(/\//g, "")
  const slugTo = messages[`${currentPage}.slug`]
    ? messages[`${currentPage}.slug`]
    : to
  const link = normalize(
    routed || language ? `/${language}/${slugTo}` : `${slugTo}`
  )

  return link
}

const Link = ({ to, language, children, onClick, ...rest }) => (
  <IntlContextConsumer>
    {intl => {
      const languageLink = language || intl.language
      const link = getLink(languageLink, to, intl.routed, intl.messages)

      const handleClick = e => {
        if (language) {
          localStorage.setItem("gatsby-intl-language", language)
        }
        if (onClick) {
          onClick(e)
        }
      }

      return (
        <GatsbyLink {...rest} to={link} onClick={handleClick}>
          {children}
        </GatsbyLink>
      )
    }}
  </IntlContextConsumer>
)

Link.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string,
  language: PropTypes.string,
}

Link.defaultProps = {
  to: "",
}

export default Link

export const navigate = (to, options) => {
  if (typeof window === "undefined") {
    return
  }

  const { language, routed, messages } = window.___gatsbyIntl
  const link = getLink(language, to, routed, messages)
  gatsbyNavigate(link, options)
}

export const changeLocale = (language, to) => {
  if (typeof window === "undefined") {
    return
  }
  const { slugs } = window.___gatsbyIntl

  const link = normalize(
    `/${language}/${slugs[language]}/${window.location.search}`
  )
  localStorage.setItem("gatsby-intl-language", language)
  gatsbyNavigate(link)
}

const normalize = url => {
  const set = url.match(/([^:]\/{2,3})/g) // Match (NOT ":") followed by (2 OR 3 "/")

  for (const str in set) {
    const replace_with = set[str].substr(0, 1) + "/"
    url = url.replace(set[str], replace_with)
  }
  return url
}
