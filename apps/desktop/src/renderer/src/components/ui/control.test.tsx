import React from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>()
  return {
    ...actual,
    useContext: () => "",
  }
})

import { Control, ControlLabel } from "./control"

function renderFunctionComponent<Props>(element: React.ReactElement<Props>) {
  if (typeof element.type !== "function") {
    throw new Error("Expected a function component element")
  }

  return (element.type as (props: Props) => React.ReactElement)(element.props)
}

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

  it("keeps helper tooltips above the label in shared settings rows with right-aligned controls", () => {
    const tree = Control({
      label: <ControlLabel label="Main Agent Mode" tooltip="Helpful context" />,
      children: <button type="button">API mode</button>,
    }) as React.ReactElement

    const sections = React.Children.toArray(tree.props.children) as React.ReactElement[]
    const labelColumn = sections[0] as React.ReactElement
    const controlColumn = sections[1] as React.ReactElement

    expect(labelColumn.props.className).toContain("sm:max-w-[52%]")
    expect(controlColumn.props.className).toContain("sm:max-w-[48%]")

    const labelWrapper = labelColumn.props.children as React.ReactElement
    const unresolvedControlLabel = labelWrapper.props.children as React.ReactElement
    const controlLabel = renderFunctionComponent(unresolvedControlLabel)
    const provider = React.Children.toArray(controlLabel.props.children)[1] as React.ReactElement
    const tooltip = provider.props.children as React.ReactElement
    const tooltipContent = React.Children.toArray(tooltip.props.children)[1] as React.ReactElement

    expect(tooltipContent.props.side).toBe("top")
    expect(tooltipContent.props.align).toBe("start")
    expect(tooltipContent.props.sideOffset).toBe(6)
    expect((controlColumn.props.children as React.ReactElement).type).toBe("button")
  })
})