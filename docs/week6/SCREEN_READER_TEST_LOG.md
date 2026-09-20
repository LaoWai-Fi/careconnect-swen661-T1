# CareConnect Week 6 Screen Reader Test Log

Complete one row for each platform before submission. Do not mark a result as passed unless it was observed with the stated assistive technology.

| App and assistive technology | Build device and OS | Test steps | Expected result | Result and evidence | Defects or follow-up |
| --- | --- | --- | --- | --- | --- |
| Flutter with Android TalkBack | Tester to record | Launch app; swipe through landing; sign in; switch tabs; open Settings; select 200%; trigger check-in; open medication form; submit empty form; open then cancel SOS. | Spoken labels, role and selected/disabled state are meaningful; focus follows visual reading order; all controls are reachable; validation/error and check-in feedback are announced; no focus trap. | Pending manual test |  |
| Flutter with iOS VoiceOver | Tester to record | Repeat Android protocol using swipe navigation and rotor controls. | Same expected behavior; modal focus remains in the open sheet/dialog and returns to the invoking control on close. | Pending manual test |  |
| React Native with Android TalkBack | Tester to record | Launch app; sign in; switch tabs; open Settings; select 200%; trigger check-in; add medication with an empty form then valid data; open then cancel SOS. | Form inputs announce visible field labels and errors/hints instead of example placeholders; tabs announce selected state; buttons/switches have roles and usable names. | Pending manual test |  |
| React Native with iOS VoiceOver | Tester to record | Repeat Android protocol using swipe navigation and rotor controls. | Same expected behavior; modal focus and return focus are usable; no unlabeled controls or duplicate focus stops. | Pending manual test |  |

## Recording checklist

- Start each recording by identifying app, platform, OS version, and screen reader.
- Demonstrate sign-in, tab navigation, Settings/text size, a form validation error, a successful feedback message, and destructive-action confirmation.
- Save the two 2–3 minute clips with descriptive names and link them in the final submission.
- Capture an issue before and after any corrective change, then include the issue ID and retest result above.
