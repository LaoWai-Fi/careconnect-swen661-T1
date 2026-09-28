import { useState } from "react";
import type { ReactNode } from "react";
import TapButton from "../components/TapButton";
import Logo from "../components/Logo";
import WindowControls from "../components/WindowControls";
import { Input } from "../components/FormField";
import {
  ActivityIcon,
  CalendarIcon,
  CareIcon,
  HelpIcon,
  MedicineIcon,
} from "../components/icons";
import type { Page } from "../types";

interface Props {
  navigate: (p: Page) => void;
}

export default function LandingPage({ navigate }: Props) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Welcome to CareConnect. I can explain the workspace or help you sign in.",
    },
  ]);

  function sendMessage() {
    if (!chatInput.trim()) return;
    setMessages((current) => [
      ...current,
      { from: "user", text: chatInput },
      {
        from: "bot",
        text: "CareConnect keeps medication reminders, appointments, activity, and care-team messages in one accessible desktop workspace.",
      },
    ]);
    setChatInput("");
  }

  return (
    <div className="welcome-window">
      <div className="window-titlebar window-drag">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-semibold text-sm">CareConnect</span>
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">Desktop design prototype</span>
        <WindowControls />
      </div>

      <div className="welcome-menubar">
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Help</span>
      </div>

      <main className="welcome-main">
        <section className="welcome-copy" aria-labelledby="welcome-title">
          <div className="welcome-brandmark"><CareIcon /></div>
          <p className="welcome-eyebrow">Care coordination, made clearer</p>
          <p id="welcome-title" className="welcome-title">
            One calm workspace for every detail of care.
          </p>
          <p className="welcome-description">
            Explore medication planning, appointments, daily activity, and care-team messages in one workspace.
          </p>
          <div className="welcome-actions">
            <TapButton size="md" variant="primary" onClick={() => navigate("signin")}>
              Sign in to your workspace
            </TapButton>
            <TapButton size="md" variant="outline" onClick={() => navigate("signup")}>
              Create an account
            </TapButton>
          </div>
          <p className="welcome-security">Designed for keyboard, screen reader, high contrast, and zoom access.</p>
        </section>

        <section className="welcome-preview" aria-label="CareConnect workspace preview">
          <div className="preview-shell">
            <div className="preview-sidebar">
              <div className="preview-person">
                <div className="profile-avatar">MT</div>
                <div>
                  <p className="font-semibold text-xs">Margaret Thompson</p>
                  <p className="text-[var(--muted-foreground)]">Care plan</p>
                </div>
              </div>
              <PreviewNav icon={<CareIcon />} label="Overview" active />
              <PreviewNav icon={<MedicineIcon />} label="Medications" />
              <PreviewNav icon={<CalendarIcon />} label="Appointments" />
              <PreviewNav icon={<ActivityIcon />} label="Activity" />
            </div>
            <div className="preview-content">
              <div className="preview-header">
                <div>
                  <p className="font-bold">Good morning, Maria</p>
                  <p>Margaret&apos;s care overview</p>
                </div>
                <span className="preview-live"><span className="presence-dot" /> Up to date</span>
              </div>
              <div className="preview-grid">
                <PreviewCard label="Medications" value="1 of 3" detail="taken today" />
                <PreviewCard label="Next appointment" value="10:30 am" detail="Blood pressure check" />
                <div className="preview-task">
                  <span className="preview-check" aria-hidden="true">✓</span>
                  <div>
                    <p className="font-semibold">Metformin recorded</p>
                    <p>500 mg · 8:30 am</p>
                  </div>
                </div>
                <div className="preview-task">
                  <span className="preview-dot" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">Amlodipine due</p>
                    <p>5 mg · 8:30 am</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="desktop-statusbar">
        <span className="flex items-center gap-2"><span className="presence-dot" /> Prototype preview</span>
        <span className="ml-auto">CareConnect Desktop</span>
      </footer>

      {!chatOpen && (
        <TapButton
          size="sm"
          variant="primary"
          onClick={() => setChatOpen(true)}
          className="welcome-help"
          aria-label="Open CareConnect help"
        >
          <HelpIcon /> Help
        </TapButton>
      )}

      {chatOpen && (
        <aside className="welcome-assistant" aria-label="CareConnect assistant">
          <div className="assistant-titlebar">
            <div className="flex items-center gap-2">
              <span className="assistant-icon"><HelpIcon /></span>
              <div>
                <p className="font-semibold text-sm">CareConnect Assistant</p>
                <p className="text-xs text-[var(--muted-foreground)]">Getting-started help</p>
              </div>
            </div>
            <TapButton size="xs" variant="ghost" onClick={() => setChatOpen(false)} aria-label="Close assistant">×</TapButton>
          </div>
          <div className="assistant-messages" aria-live="polite">
            {messages.map((message, index) => (
              <p key={index} className={message.from === "user" ? "assistant-message-user" : "assistant-message"}>
                {message.text}
              </p>
            ))}
          </div>
          <div className="assistant-input">
            <Input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && sendMessage()}
              placeholder="Ask a question"
              className="desktop-search-input"
            />
            <TapButton size="xs" variant="primary" onClick={sendMessage}>Send</TapButton>
          </div>
        </aside>
      )}
    </div>
  );
}

function PreviewNav({ icon, label, active }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`preview-nav ${active ? "preview-nav-active" : ""}`}>
      {icon}<span>{label}</span>
    </div>
  );
}

function PreviewCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="preview-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  );
}
