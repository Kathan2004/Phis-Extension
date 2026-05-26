import type { EmailArtifact, Indicator } from "../../types/analysis"

export const runBehavioralScoring = (email: EmailArtifact): Indicator[] => {
  const indicators: Indicator[] = []

  const shortBody = email.bodyText.length < 120
  const highLinkDensity = email.links.length >= 3 && email.bodyText.length / Math.max(email.links.length, 1) < 140
  const externalReplyTo = email.replyToDomain && email.senderDomain && email.replyToDomain !== email.senderDomain

  if (shortBody && highLinkDensity) {
    indicators.push({
      id: "behavior_short_link_dense",
      category: "behavior",
      weight: 9,
      title: "Abnormal message composition",
      detail: "Email body is very short with unusually high link density."
    })
  }

  if (externalReplyTo) {
    indicators.push({
      id: "behavior_reply_external",
      category: "behavior",
      weight: 10,
      title: "External reply workflow",
      detail: "Sender asks for replies to a different external domain."
    })
  }

  return indicators
}
