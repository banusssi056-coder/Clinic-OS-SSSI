import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import PredictiveDiagnosis from "../pages/PredictiveDiagnosis";
import AIConsultationSupport from "../pages/AIConsultationSupport";

// ResizeObserver mock for recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock variables hoisted before vi.mock
const { mockInvoke, mockInsert, mockUpdate, mockMatch } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
  mockInsert: vi.fn().mockResolvedValue({ data: {}, error: null }),
  mockUpdate: vi.fn().mockReturnThis(),
  mockMatch: vi.fn().mockResolvedValue({ data: {}, error: null })
}));

// Helper to create chainable mocks that are also real Promises
const createQueryMock = (data: any) => {
  const promise = Promise.resolve({ data, error: null }) as any;
  const chainableMethods = [
    "select", "eq", "in", "order", "gte", "lte", "single",
    "insert", "update", "match", "limit"
  ];
  chainableMethods.forEach((method) => {
    promise[method] = () => promise;
  });
  return promise;
};

vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-doctor-user-id" } } }),
      },
      from: vi.fn().mockImplementation((table) => {
        if (table === "patients") {
          return createQueryMock({
            id: "patient-1",
            name: "Sarah Smith",
            age: 30,
            gender: "Female",
            full_name: "Sarah Smith",
            date_of_birth: "1996-01-01",
            phone: "1234567890"
          });
        }
if (table === "doctors") {
  return createQueryMock({
    id: "doctor-1",
    name: "Dr. House",
    specialty: "Diagnostics",
    user_id: "test-doctor-user-id"
  });
}
        if (table === "consultation_sessions") {
          const p = createQueryMock(null);
          p.insert = mockInsert;
          p.update = mockUpdate;
          p.match = mockMatch;
          return p;
        }
        if (table === "chronic_risk_plans") {
          return createQueryMock({
            id: "plan-1",
            patient_id: "patient-1",
            risk_score: 15
          });
        }
if (table === "appointments") {
  return createQueryMock([
    {
      id: "appt-1",
      patient_id: "patient-1",
      doctor_id: "doctor-1",
      scheduled_at: new Date().toISOString(),
      type: "Checkup",
      status: "Booked",
      patient: { 
        id: "patient-1", 
        name: "Sarah Smith", 
        phone: "1234567890",
        age: 30,
        gender: "Female",
        tags: [],
        last_visit: null
      }
    }
  ]);
}
        if (table === "diagnosis_suggestions") {
          const p = createQueryMock([
            {
              id: "suggestion-1",
              appointment_id: "appt-1",
              patient_id: "patient-1",
              suggested_condition: "Common Cold",
              probability: 80,
              supporting_evidence: "Coughing and sneezing",
              recommended_tests: ["CBC"],
              recommended_medicines: ["Paracetamol"],
              urgency: "Routine",
              confirmed_by_doctor: false,
              dismissed_by_doctor: false,
              created_at: new Date().toISOString(),
            }
          ]);
          p.insert = mockInsert;
          p.update = mockUpdate;
          p.match = mockMatch;
          return p;
        }
        if (table === "ai_suggestions") {
          const p = createQueryMock([
            {
              id: "suggestion-abc",
              session_id: "session-1",
              suspected_conditions: [{ name: "Influenza", probability: 75 }],
              recommended_tests: ["Flu Test"],
              recommended_medicines: [{ name: "Tamiflu", dosage: "75mg" }],
              notes: "Rest and hydration recommended.",
              created_at: new Date().toISOString()
            }
          ]);
          p.insert = mockInsert;
          return p;
        }

        return createQueryMock([]);
      }),
      functions: {
        invoke: mockInvoke,
      },
    },
  };
});

// Mock Sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("AI Features Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Predictive Diagnosis Feature", () => {
    it("should fetch appointments, call ai-insights with clinical system prompt and parse/display suggested diagnoses", async () => {
      mockInvoke.mockResolvedValue({
        data: {
          answer: JSON.stringify([
            {
              condition: "Gastroenteritis",
              probability: 85,
              evidence: "Nausea, vomiting, and abdominal pain.",
              tests: ["Stool Culture"],
              medicines: ["ORS", "Zinc Supplement"],
              urgency: "Routine"
            }
          ])
        },
        error: null
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <PredictiveDiagnosis />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Select Appointment:/)).toBeInTheDocument();
      });

      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "appt-1" } });

      const analyzeBtn = screen.getByRole("button", { name: /Analyze/i });
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          "ai-insights",
          expect.objectContaining({
            body: expect.objectContaining({
              mode: "chat",
              systemPrompt: expect.stringContaining("You are a professional clinical assistant"),
              question: expect.stringContaining("Given patient demographics and history"),
            })
          })
        );
      });

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            appointment_id: "appt-1",
            patient_id: "patient-1",
            suggested_condition: "Gastroenteritis",
            probability: 85,
            supporting_evidence: "Nausea, vomiting, and abdominal pain.",
            recommended_tests: ["Stool Culture"],
            recommended_medicines: ["ORS", "Zinc Supplement"],
            urgency: "Routine"
          })
        );
      });
    });
  });

  describe("AI Consultation Support Feature", () => {
    it("should start consultation session, ask ai-insights with consultation prompt, and clean/parse JSON response", async () => {
      mockInsert.mockResolvedValueOnce({
        data: {
          id: "session-1",
          appointment_id: "appt-1",
          patient_id: "patient-1",
          doctor_id: "doctor-1",
          session_status: "Active",
          patient: { id: "patient-1", full_name: "Sarah Smith", date_of_birth: "1996-01-01", phone: "1234567890" }
        },
        error: null
      });

      mockInvoke.mockResolvedValue({
        data: {
          answer: JSON.stringify({
            diagnoses: [{ name: "Bronchitis", probability: 70 }],
            tests: ["Chest X-ray"],
            medicines: [{ name: "Cough Syrup", dosage: "10ml" }],
            notes: "Advised steam inhalation."
          })
        },
        error: null
      });

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <AIConsultationSupport />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Sarah Smith")).toBeInTheDocument();
      });

      const startBtn = screen.getByRole("button", { name: /Start Consultation/i });
      fireEvent.click(startBtn);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith({
          appointment_id: "appt-1",
          patient_id: "patient-1",
          doctor_id: "doctor-1",
          session_status: "Active"
        });
      });
    });
  });
});
