import React from "react"
import { describe, expect, it } from "vitest"

import { Control, ControlLabel } from "./control"

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

  it("opens helper tooltips above the label so they do not spill into the control column", () => {
    const tree = ControlLabel({ label: "Main Agent Mode", tooltip: "Helpful context" }) as React.ReactElement

    const provider = React.Children.toArray(tree.props.children)[1] as React.ReactElement
    const tooltip = provider.props.children as React.ReactElement
    const tooltipContent = React.Children.toArray(tooltip.props.children)[1] as React.ReactElement

    expect(tooltipContent.props.side).toBe("top")
    expect(tooltipContent.props.align).toBe("start")
    expect(tooltipContent.props.sideOffset).toBe(6)
  })
})