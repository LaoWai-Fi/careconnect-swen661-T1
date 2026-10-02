import { useState } from "react"
import { render, screen, within, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import MessagesPage from "../../src/pages/MessagesPage"
import * as care from "../../src/state/careLogic"
import type { Message } from "../../src/types"

function Harness({ initialId, messages, handLeft = false }: { initialId?: string | null; messages?: Message[]; handLeft?: boolean }) {
  const [state, setState] = useState(() => ({ ...care.createInitialState(), ...(messages ? { messages } : {}) }))
  return (
    <>
      <output data-testid="count">{state.messages.length}</output>
      <MessagesPage
        messages={state.messages}
        onMarkRead={(id) => setState((s) => care.markMessageRead(s, id))}
        onToggleRead={(id) => setState((s) => care.toggleMessageRead(s, id))}
        onDelete={(id) => setState((s) => care.deleteMessage(s, id))}
        onArchive={(id) => setState((s) => care.archiveMessage(s, id))}
        onUnarchive={(id) => setState((s) => care.unarchiveMessage(s, id))}
        onSend={(data) => setState((s) => care.sendMessage(s, data))}
        currentUser="Jane Roe"
        navigate={jest.fn()}
        initialMessageId={initialId ?? null}
        handLeft={handLeft}
      />
    </>
  )
}

function setup(props: Parameters<typeof Harness>[0] = {}) {
  const user = userEvent.setup()
  render(<Harness {...props} />)
  return { user }
}

const folders = () => within(screen.getByRole("group", { name: /message folders/i }))
const inbox = () => within(screen.getByRole("list", { name: /inbox messages/i }))
const first = care.createInitialState().messages[0]

describe("MessagesPage", () => {
  test("lists inbox messages with read/unread toggles", async () => {
    const { user } = setup()
    const unreadButton = inbox().getAllByRole("button", { name: /^Mark message from .* as read$/ })[0]
    await user.click(unreadButton)
    expect(unreadButton).toHaveAttribute("aria-pressed", "false")
    await user.click(unreadButton)
    expect(unreadButton).toHaveAttribute("aria-pressed", "true")
  })

  test("opening a message shows details and marks it read; back returns to the list", async () => {
    const { user } = setup()
    await user.click(inbox().getAllByRole("button", { name: new RegExp(`from ${first.from}: ${first.subject}`) })[0])
    expect(screen.getByRole("heading", { name: first.subject })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Mark as unread" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Mark as unread" }))
    expect(screen.getByRole("button", { name: "Mark as read" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /back to messages/i }))
    expect(screen.getByRole("list", { name: /inbox messages/i })).toBeInTheDocument()
  })

  test("archive and unarchive from the detail view and the list", async () => {
    const { user } = setup({ initialId: first.id })
    await user.click(screen.getByRole("button", { name: "Archive message" }))
    expect(screen.getByText("Message moved to Archive")).toBeInTheDocument()
    await user.click(folders().getByRole("button", { name: /archive/i }))
    const archive = within(screen.getByRole("list", { name: /archived messages/i }))
    await user.click(archive.getByRole("button", { name: new RegExp(`from ${first.from}: `) }))
    expect(screen.getByText(/in archive/i)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /unarchive message and move it back/i }))
    expect(screen.getByText("Message moved back to Inbox")).toBeInTheDocument()
    expect(screen.getByText("No archived messages")).toBeInTheDocument()
    await user.click(folders().getByRole("button", { name: /inbox/i }))
    await user.click(inbox().getByRole("button", { name: `Archive message from ${first.from}` }))
    expect(screen.getByText(`Message from ${first.from} moved to Archive`)).toBeInTheDocument()
    await user.click(folders().getByRole("button", { name: /archive/i }))
    await user.click(screen.getByRole("button", { name: `Unarchive message from ${first.from}` }))
    expect(screen.getByText(`Message from ${first.from} moved back to Inbox`)).toBeInTheDocument()
  })

  test("opening an archived message directly selects the Archive folder", async () => {
    const msgs = care.createInitialState().messages.map((m) => (m.id === first.id ? { ...m, archived: true } : m))
    const { user } = setup({ initialId: first.id, messages: msgs })
    await user.click(screen.getByRole("button", { name: /back to archived messages/i }))
    expect(screen.getByRole("heading", { name: "Archived messages" })).toBeInTheDocument()
  })

  test("delete asks for confirmation", async () => {
    const { user } = setup({ initialId: first.id })
    const before = Number(screen.getByTestId("count").textContent)
    await user.click(screen.getByRole("button", { name: "Delete message" }))
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }))
    await user.click(screen.getByRole("button", { name: "Delete message" }))
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }))
    expect(Number(screen.getByTestId("count").textContent)).toBe(before - 1)
  })

  test("compose with cc, bcc and attachments, then send", async () => {
    const { user } = setup()
    const before = Number(screen.getByTestId("count").textContent)
    await user.click(screen.getByRole("button", { name: /compose new message/i }))
    const send = screen.getByRole("button", { name: "Send" })
    expect(send).toBeDisabled()
    await user.type(screen.getByLabelText(/^to/i), "Dr. Sharma, Nurse Lee")
    await user.click(screen.getByRole("button", { name: /add cc/i }))
    await user.type(screen.getByLabelText(/^cc/i), "Tom")
    await user.click(screen.getByRole("button", { name: /add bcc/i }))
    await user.type(screen.getByLabelText(/^bcc/i), "Ana")
    await user.type(screen.getByLabelText(/^subject/i), "BP readings")
    await user.type(screen.getByLabelText(/^body/i), "Attached.")
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!
    await user.click(screen.getByRole("button", { name: /attach file/i }))
    fireEvent.change(fileInput, {
      target: { files: [new File(["x"], "readings.pdf", { type: "application/pdf" }), new File(["y"], "photo.png", { type: "image/png" }), new File(["z"], "notes")] },
    })
    expect(screen.getByText("readings.pdf")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Remove attachment photo.png" }))
    expect(screen.queryByText("photo.png")).not.toBeInTheDocument()
    await user.click(send)
    expect(Number(screen.getByTestId("count").textContent)).toBe(before + 1)
    expect(inbox().getByRole("button", { name: /Message from Jane Roe: BP readings/ })).toBeInTheDocument()
  })

  test("reply pre-fills the recipient and subject; cancel discards", async () => {
    const { user } = setup({ initialId: first.id })
    await user.click(screen.getByRole("button", { name: `Reply to ${first.from}` }))
    expect(screen.getByLabelText(/^to/i)).toHaveValue(first.from)
    expect(screen.getByLabelText(/^subject/i)).toHaveValue(`Re: ${first.subject}`)
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.getByRole("list", { name: /inbox messages/i })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /compose new message/i }))
    await user.click(screen.getByRole("button", { name: /back to messages/i }))
    expect(screen.getByRole("list", { name: /inbox messages/i })).toBeInTheDocument()
  })

  test("empty inbox", () => {
    setup({ messages: [], handLeft: true })
    expect(screen.getByText("No messages yet")).toBeInTheDocument()
  })
})
