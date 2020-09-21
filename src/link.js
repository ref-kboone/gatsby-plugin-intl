import React from "react"
import PropTypes from "prop-types"
import { Link as GatsbyLink, navigate as gatsbyNavigate } from "gatsby"
import { IntlContextConsumer } from "./intl-context"

const getLink = (language, to, routed, messages) => {
  const slugTo = to
    .split("/")
    .map(slug => messages[`${slug}.slug`] || slug)
    .join("/")
  return normalize(routed || language ? `/${language}/${slugTo}` : `${slugTo}`)
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
  return url.replace(/(https?:\/\/)|(\/)+/g, "$1$2")
}
