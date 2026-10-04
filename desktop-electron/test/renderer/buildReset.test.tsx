// Each new build starts from the stock sample care plan: a care-data.json
// written by a different build is ignored at startup.
import { screen } from "@testing-library/react"
import * as care from "../../src/state/careLogic"
import { isFromOtherBuild } from "../../src/lib/buildInfo"
import { goTo, installBridge, setup, signIn } from "./helpers"

jest.mock("../../src/lib/buildInfo", () => {
  const actual = jest.requireActual("../../src/lib/buildInfo")
  return {
    ...actual,
    BUILD_ID: "build-2",
    isFromOtherBuild: (saved: unknown) => actual.isFromOtherBuild(saved, "build-2"),
  }
})

const savedBy = (buildId: string | undefined) => {
  const state = care.addMedication(care.createInitialState(), {
    name: "Vitamin D",
    dose: "1000 IU",
    time: "09:00",
    notes: "",
  })
  const data = care.toCareData(state, "Jane Roe", "unused")
  if (buildId === undefined) delete data.buildId
  else data.buildId = buildId
  return data
}

describe("isFromOtherBuild", () => {
  const real = jest.requireActual("../../src/lib/buildInfo") as { isFromOtherBuild: typeof isFromOtherBuild }
  test("dev runs always keep saved data", () => {
    expect(real.isFromOtherBuild("anything", "dev")).toBe(false)
    expect(real.isFromOtherBuild(undefined, "dev")).toBe(false)
  })
  test("production builds keep only their own data", () => {
    expect(real.isFromOtherBuild("b1", "b1")).toBe(false)
    expect(real.isFromOtherBuild("b0", "b1")).toBe(true)
    expect(real.isFromOtherBuild(undefined, "b1")).toBe(true)
  })
})

describe("startup load", () => {
  test("a care plan saved by an earlier build is ignored", async () => {
    installBridge({ loadCareData: jest.fn().mockResolvedValue({ ok: true, data: savedBy("build-1") }) })
    const { user } = setup()
    await signIn(user)
    expect(await screen.findByText("New build: starting from the sample care plan")).toBeInTheDocument()
    await goTo(user, "Medications")
    expect(screen.queryByText("Vitamin D")).not.toBeInTheDocument()
  })

  test("a file without a build id (older save) is also ignored", async () => {
    installBridge({ loadCareData: jest.fn().mockResolvedValue({ ok: true, data: savedBy(undefined) }) })
    const { user } = setup()
    await signIn(user)
    await goTo(user, "Medications")
    expect(screen.queryByText("Vitamin D")).not.toBeInTheDocument()
  })

  test("a care plan saved by this build is restored", async () => {
    const bridge = installBridge({ loadCareData: jest.fn().mockResolvedValue({ ok: true, data: savedBy("build-2") }) })
    const { user } = setup()
    await signIn(user)
    await goTo(user, "Medications")
    expect(await screen.findByText("Vitamin D")).toBeInTheDocument()
    expect(bridge.loadCareData).toHaveBeenCalled()
  })
})
