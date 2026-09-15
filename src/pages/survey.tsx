import { useState } from "react";

const PAPER = "#EEEAE0";
const INK = "#242220";
const INK_SOFT = "#605B54";
const RULE = "#D8D2C4";
const ACCENT = "#3E5C4E";
const ACCENT_SOFT = "#E4E9E1";

type QuestionType = "single" | "multi";

interface Question {
id: string;
prompt: string;
type: QuestionType;
options: string[];
hint?: string;
max?: number;
}

type Answer = string | string[];
type Answers = Record<string, Answer>;

const QUESTIONS: Question[] = [
{
    id: "gradeLevel",
    prompt: "What's your current grade level?",
    type: "single",
    options: ["High school", "Undergraduate", "Graduate", "Other"],
},
{
    id: "frequency",
    prompt: "How often do you use AI tools (ChatGPT, Claude, etc.) for schoolwork?",
    type: "single",
    options: [
    "Daily",
    "A few times a week",
    "A few times a month",
    "Rarely",
    "Never",
    ],
},
{
    id: "purpose",
    prompt: "What do you mainly use AI for in schoolwork?",
    hint: "Choose up to 2",
    type: "multi",
    max: 2,
    options: [
    "Brainstorming or outlining",
    "Explaining concepts",
    "Editing my writing",
    "Writing drafts or full assignments",
    "Solving homework problems",
    "Studying for exams",
    ],
},
{
    id: "depth",
    prompt:
    "Do you feel you understand material as deeply when you use AI to help, compared to working through it alone?",
    type: "single",
    options: [
    "Much less deeply",
    "Somewhat less",
    "About the same",
    "Somewhat more deeply",
    ],
},
{
    id: "acceptable",
    prompt: "Which of these would you consider acceptable use of AI on an assignment?",
    hint: "Choose all that apply",
    type: "multi",
    options: [
    "Explaining a concept in simpler terms",
    "Fixing grammar or spelling",
    "Generating an outline",
    "Writing a full draft I edit myself",
    "Writing the whole thing to submit",
    ],
},
{
    id: "guidance",
    prompt: "Has your school given clear guidance on what AI use is allowed?",
    type: "single",
    options: ["Yes, clear guidance", "Vague or inconsistent", "No guidance at all"],
},
];

interface TallyProps {
total: number;
current: number;
}

function Tally({ total, current }: TallyProps) {
return (
    <div className="flex gap-1.5">
    {Array.from({ length: total }).map((_, i) => (
        <div
        key={i}
        className="w-[3px] rounded-sm transition-all duration-300 ease-out"
        style={{
            height: i < current ? 22 : 14,
            background: i < current ? ACCENT : RULE,
            transform: i < current ? "rotate(6deg)" : "none",
        }}
        />
    ))}
    </div>
);
}

const API_URL = "http://localhost:3100"; // swap for deployed API URL in production

export default function SurveyApp() {
const [step, setStep] = useState<number>(0);
const [answers, setAnswers] = useState<Answers>({});
const [done, setDone] = useState<boolean>(false);
const [submitting, setSubmitting] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

const q: Question = QUESTIONS[step];
const isLast = step === QUESTIONS.length - 1;
const current: Answer | undefined = answers[q?.id];

const canAdvance =
    q?.type === "single" ? Boolean(current) : Array.isArray(current) && current.length > 0;

function selectSingle(opt: string) {
    setAnswers((a) => ({ ...a, [q.id]: opt }));
}

function toggleMulti(opt: string) {
    setAnswers((a) => {
    const existing = Array.isArray(a[q.id]) ? (a[q.id] as string[]) : [];
    const has = existing.includes(opt);
    if (has) return { ...a, [q.id]: existing.filter((o) => o !== opt) };
    if (q.max && existing.length >= q.max) return a;
    return { ...a, [q.id]: [...existing, opt] };
    });
}

async function next() {
    if (!isLast) {
    setStep((s) => s + 1);
    return;
    }

    setSubmitting(true);
    setError(null);

    try {
    const res = await fetch(`${API_URL}/survey-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers), // keys already match FastAPI's expected aliases
    });

    if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
    }

    setDone(true);
    } catch (err) {
    console.error("Failed to submit survey response", err);
    setError("Something went wrong submitting your response. Please try again.");
    } finally {
    setSubmitting(false);
    }
}

function back() {
    if (step > 0) setStep((s) => s - 1);
}

return (
    <div
    className="min-h-full flex justify-center px-5 py-10 font-serif"
    style={{ background: PAPER, color: INK }}>
    <div className="w-full max-w-[520px]">
        {/* Header */}
        <div className="flex justify-between items-baseline mb-7">
        <div>
            <div
            className="text-xs tracking-wide font-sans"
            style={{ color: INK_SOFT }}>
            A short study on
            </div>
            <div className="text-[22px] font-semibold mt-0.5">
            AI use in coursework
            </div>
        </div>
        {!done && <Tally total={QUESTIONS.length} current={step + 1} />}
        </div>

        {/* Card */}
        <div
        className="rounded p-8 min-h-[320px] flex flex-col"
        style={{ background: "#FBFAF6", border: `1px solid ${RULE}` }}>
        {!done ? (
            <>
            <div
                className="text-[11px] font-sans mb-2.5"
                style={{ color: INK_SOFT }}>
                Question {step + 1} of {QUESTIONS.length}
            </div>

            <div className="text-lg leading-snug mb-1.5">{q.prompt}</div>

            {q.hint ? (
                <div
                className="text-sm font-sans mb-4"
                style={{ color: INK_SOFT }}>
                {q.hint}
                </div>
            ) : (
                <div className="mb-4" />
            )}

            <div className="flex flex-col gap-2.5 flex-1">
                {q.options.map((opt) => {
                const selected =
                    q.type === "single"
                    ? current === opt
                    : Array.isArray(current) && current.includes(opt);
                return (
                    <button
                    key={opt}
                    onClick={() =>
                        q.type === "single" ? selectSingle(opt) : toggleMulti(opt)
                    }
                    className="text-left rounded-sm px-3.5 py-3 text-[15px] font-serif cursor-pointer flex items-center gap-2.5 transition-all duration-150 ease-out"
                    style={{
                        border: `1px solid ${selected ? ACCENT : RULE}`,
                        background: selected ? ACCENT_SOFT : "transparent",
                        color: INK,
                    }}>
                    <span
                        className={`w-3.5 h-3.5 flex-shrink-0 ${
                        q.type === "single" ? "rounded-full" : "rounded-sm"
                        }`}
                        style={{
                        border: `1.5px solid ${selected ? ACCENT : INK_SOFT}`,
                        background: selected ? ACCENT : "transparent",
                        }}/>
                    {opt}
                    </button>
                );
                })}
            </div>

            <div className="flex justify-between items-center mt-6 font-sans">
                <button
                onClick={back}
                disabled={step === 0}
                className="bg-transparent border-none text-sm p-0"
                style={{
                    color: step === 0 ? RULE : INK_SOFT,
                    cursor: step === 0 ? "default" : "pointer",
                }}>
                Back
                </button>
                <button
                onClick={next}
                disabled={!canAdvance || submitting}
                className="border-none rounded-sm px-5 py-2.5 text-sm font-semibold transition-colors duration-150 ease-out"
                style={{
                    background: canAdvance && !submitting ? ACCENT : RULE,
                    color: canAdvance && !submitting ? "#FBFAF6" : "#948E82",
                    cursor: canAdvance && !submitting ? "pointer" : "default",
                }}>
                {isLast ? (submitting ? "Submitting…" : "Submit") : "Next"}
                </button>
            </div>

            {error && (
                <div
                className="text-xs font-sans mt-3"
                style={{ color: "#B5533C" }}
                >
                {error}
                </div>
            )}
            </>
        ) : (
            <div className="flex flex-col items-start justify-center flex-1 gap-2">
            <div className="text-lg font-semibold">Thanks for taking part.</div>
            <div
                className="text-sm leading-relaxed font-sans"
                style={{ color: INK_SOFT }}>
                Your responses have been recorded. They'll be used, alongside
                everyone else's, to study how students are actually using AI
                tools in coursework.
            </div>
            </div>
        )}
        </div>

        <div
        className="mt-4 text-xs font-sans text-center"
        style={{ color: INK_SOFT }}>
        Responses are anonymous and used for research purposes only.
        </div>
    </div>
    </div>
);
}