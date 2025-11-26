import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalculatorSection } from "./CalculatorSection";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock API - must be defined inside vi.mock factory
vi.mock("@/lib/api", () => {
  const mockCalculateDebt = vi.fn();
  const mockSaveUserData = vi.fn();
  const mockGetUserData = vi.fn(() => null);
  
  return {
    prayerDebtAPI: {
      calculateDebt: mockCalculateDebt,
    },
    localStorageAPI: {
      saveUserData: mockSaveUserData,
      getUserData: mockGetUserData,
    },
  };
});

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock telegram
vi.mock("@/lib/telegram", () => ({
  getTelegramUserId: vi.fn(() => null),
}));

// Mock audit-log
vi.mock("@/lib/audit-log", () => ({
  logCalculation: vi.fn(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("CalculatorSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderCalculatorMode = async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CalculatorSection />
      </QueryClientProvider>
    );

    const modeButton = await screen.findByRole("button", { name: /помощь посчитать/i });
    await user.click(modeButton);
    return { user, queryClient };
  };

  it("should render calculator form", () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CalculatorSection />
      </QueryClientProvider>
    );

    expect(screen.getByText(/калькулятор пропущенных намазов/i)).toBeInTheDocument();
  });

  it("should show validation errors for invalid input", async () => {
    const { user } = await renderCalculatorMode();

    const submitButton = screen.getByRole("button", { name: /рассчитать долг/i });
    await user.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/пожалуйста, укажите дату рождения/i)).toBeInTheDocument();
    });
  });

  it("should handle form submission with valid data", async () => {
    const { user } = await renderCalculatorMode();
    const { prayerDebtAPI } = await import("@/lib/api");
    vi.mocked(prayerDebtAPI.calculateDebt).mockResolvedValue({
      user_id: "test",
      debt_calculation: { total_days: 100 },
    } as any);

    const birthDateInput = screen.getByLabelText(/дата рождения/i);
    await user.type(birthDateInput, "2000-01-01");

    // Find gender radio buttons by their values
    const maleRadio = screen.getByRole("radio", { name: /мужской/i });
    await user.click(maleRadio);

    // Submit form
    const submitButton = screen.getByRole("button", { name: /рассчитать долг/i });
    await user.click(submitButton);

    // Should attempt to calculate
    await waitFor(() => {
      expect(prayerDebtAPI.calculateDebt).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});

