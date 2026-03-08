import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Control, ControlGroup, ControlLabel } from "./control"

describe("Control", () => {
  it("uses a stacked-first layout so settings rows stay usable on narrow widths", () => {
    const tree = Control({ label: "Theme", children: <input /> }) as React.ReactElement
    const sections = React.Children.toArray(tree.props.children) as React.ReactElement[]

    expect(tree.props.className).toContain("flex-col")
    expect(tree.props.className).toContain("sm:flex-row")
    expect(sections[0].props.className).toContain("sm:max-w-[52%]")
    expect(sections[1].props.className).toContain("w-full")
    expect(sections[1].props.className).toContain("sm:max-w-[48%]")
  })
})

describe("ControlLabel", () => {
  it("allows long labels with tooltips to wrap instead of clipping", () => {
    const tree = ControlLabel({ label: "Extremely long label", tooltip: "Helpful context" }) as React.ReactElement

    expect(tree.props.className).toContain("flex-wrap")
    const textLabel = React.Children.toArray(tree.props.children)[0] as React.ReactElement
    expect(textLabel.props.className).toContain("break-words")
  })
})

describe("ControlGroup", () => {
  it("renders collapsible settings headers as full-width disclosure rows", () => {
    const markup = renderToStaticMarkup(
      <ControlGroup collapsible defaultCollapsed title="General">
        <div>Hidden controls</div>
      </ControlGroup>,
    )

    expect(markup).toContain("overflow-hidden rounded-lg border bg-card/40")
    expect(markup).toContain("w-full items-center justify-between")
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).toContain("hover:bg-accent/30")
  })
})