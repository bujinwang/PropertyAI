import React from 'react';
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from '../design-system/theme';
import AssignmentModal from './AssignmentModal';
import { dashboardService, UnitOption } from '../services/dashboardService';

/**
 * NEVER call `fireEvent` from inside a `waitFor` callback.
 *
 * `waitFor` observes the container with a MutationObserver, and in jsdom that
 * delivery happens on the *microtask* queue. A callback that both mutates the
 * DOM and keeps throwing therefore re-arms the observer from inside the
 * microtask queue forever: the event loop never yields, so `waitFor`'s own
 * timeout can never fire and neither can Jest's `--testTimeout`. The suite
 * never terminates at all — in CI that burns the entire job timeout instead of
 * failing, which is strictly worse than a red test.
 *
 * So: use `waitFor` only to await async state, and fire events outside it.
 *
 * This file used to hang for exactly that reason. A CPU sample of the blocked
 * process showed every main-thread sample stuck in
 * `v8::internal::MicrotaskQueue::RunMicrotasks` ->
 * `Builtins_PromiseFulfillReactionJob`.
 */

/**
 * MUI X v8's DatePicker no longer renders an <input>: it renders a
 * `contenteditable` section list (one `<span role="spinbutton">` per
 * MM/DD/YYYY). So `fireEvent.change(input, { target: { value } })` had nothing
 * to target, and `getByLabelText(/lease start/i)` matched several nodes at once
 * ("Found multiple elements"). Those tests were written against the MUI X
 * v5/v6 API.
 *
 * These tests cover AssignmentModal's own form wiring, not MUI X's calendar
 * widget, so the picker is replaced with a plain labelled date input that
 * honours the same contract the component depends on: `value: Date | null`,
 * `onChange(Date | null)`, and `slotProps.textField.helperText`.
 */
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({
    label,
    value,
    onChange,
    slotProps,
  }: {
    label: string;
    value: Date | null;
    onChange: (value: Date | null) => void;
    slotProps?: { textField?: { helperText?: React.ReactNode } };
  }) => {
    const id = `datepicker-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const helperText = slotProps?.textField?.helperText;
    const iso =
      value instanceof Date && !Number.isNaN(value.getTime())
        ? value.toISOString().slice(0, 10)
        : '';
    return (
      <div>
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          type="date"
          value={iso}
          onChange={(event) =>
            onChange(event.target.value ? new Date(`${event.target.value}T00:00:00.000Z`) : null)
          }
        />
        {helperText ? <p>{helperText}</p> : null}
      </div>
    );
  },
}));

// Mock the dashboard service
jest.mock('../services/dashboardService', () => ({
  ...jest.requireActual('../services/dashboardService'),
  dashboardService: {
    getVacantUnitOptions: jest.fn(),
    assignTenantToUnit: jest.fn(),
    unassignTenant: jest.fn(),
    bulkAssign: jest.fn(),
  },
}));

const mockGetVacantUnitOptions = dashboardService.getVacantUnitOptions as jest.MockedFunction<typeof dashboardService.getVacantUnitOptions>;
const mockAssignTenantToUnit = dashboardService.assignTenantToUnit as jest.MockedFunction<typeof dashboardService.assignTenantToUnit>;
const mockUnassignTenant = dashboardService.unassignTenant as jest.MockedFunction<typeof dashboardService.unassignTenant>;
const mockBulkAssign = dashboardService.bulkAssign as jest.MockedFunction<typeof dashboardService.bulkAssign>;

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {component}
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const mockUnitOptions: UnitOption[] = [
  { id: 'u1', unitNumber: '101', address: '123 Main St' },
  { id: 'u2', unitNumber: '102', address: '123 Main St' },
  { id: 'u3', unitNumber: '201', address: '456 Oak Ave' },
];

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  tenantId: 't1',
  tenantIds: [],
  unitId: 'u1',
  mode: 'assign' as const,
  propertyId: 'p1',
  onSubmit: jest.fn(),
};

/** Returns a picker's input. Safe before the options request resolves: MUI keeps
 *  the popup mounted and re-renders the list once `options` fills in. */
const getPicker = (label: RegExp = /select vacant unit/i) =>
  screen.getByLabelText(label) as HTMLInputElement;

/** Opens a picker's listbox and waits for it to actually be open. RTL's
 *  `fireEvent` is not act-wrapped, so the `aria-expanded` update has not
 *  flushed by the time `fireEvent.mouseDown` returns. */
const openPicker = async (input: HTMLInputElement) => {
  if (input.getAttribute('aria-expanded') !== 'true') {
    fireEvent.mouseDown(input);
  }
  await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'true'));
};

/** Clicks an option *inside the listbox*. Scoped by role on purpose: once an
 *  option is chosen its label also renders as a chip, so a plain `getByText`
 *  would match two nodes in multi-select mode.
 *
 *  MUI closes the listbox as soon as an option is selected — the bulk picker
 *  does not set `disableCloseOnSelect` — so the click is wrapped in `act` to
 *  flush that close before `aria-expanded` is read again. Otherwise the next
 *  call sees a stale "open" and skips re-opening. */
const selectOption = async (input: HTMLInputElement, optionText: string) => {
  await openPicker(input);
  const find = () => screen.getAllByRole('option').find((o) => o.textContent?.trim() === optionText);
  await waitFor(() => expect(find()).toBeDefined());
  await act(async () => {
    fireEvent.click(find()!);
  });
};

describe('AssignmentModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetVacantUnitOptions.mockResolvedValue(mockUnitOptions);
  });

  describe('Render Tests', () => {
    it('renders assign mode with form fields', async () => {
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Assign Tenant to Unit')).toBeInTheDocument();
        expect(screen.getByLabelText(/select vacant unit/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/lease start/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/lease end/i)).toBeInTheDocument();
      });
    });

    it('renders unassign mode with confirmation', async () => {
      renderWithProviders(<AssignmentModal {...defaultProps} mode="unassign" />);

      await waitFor(() => {
        expect(screen.getByText('Unassign Tenant')).toBeInTheDocument();
        expect(screen.getByText(/confirm unassigning tenant/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /confirm unassign/i })).toBeInTheDocument();
      });
    });

    it('renders bulk mode with tenant chips and unit selection', async () => {
      const bulkProps = { ...defaultProps, mode: 'bulk' as const, tenantIds: ['t1', 't2'] };
      renderWithProviders(<AssignmentModal {...bulkProps} />);

      await waitFor(() => {
        expect(screen.getByText('Bulk Assignment')).toBeInTheDocument();
        expect(screen.getByText('Assigning 2 selected tenants')).toBeInTheDocument();
        expect(screen.getByText('Tenant t1')).toBeInTheDocument();
        expect(screen.getByText('Tenant t2')).toBeInTheDocument();
        expect(screen.getByLabelText(/select units/i)).toBeInTheDocument();
      });
    });

    it('fetches vacant unit options on open', async () => {
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetVacantUnitOptions).toHaveBeenCalledWith('p1');
      });
    });
  });

  describe('Selection Tests', () => {
    it('allows unit selection in assign mode', async () => {
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      const unitSelect = getPicker();
      await selectOption(unitSelect, '101 - 123 Main St');

      await waitFor(() => expect(unitSelect).toHaveValue('101 - 123 Main St'));
    });

    it('allows multiple unit selection in bulk mode', async () => {
      const bulkProps = { ...defaultProps, mode: 'bulk' as const, tenantIds: ['t1'] };
      renderWithProviders(<AssignmentModal {...bulkProps} />);

      const unitSelect = getPicker(/select units/i);
      await selectOption(unitSelect, '101 - 123 Main St');
      await selectOption(unitSelect, '102 - 123 Main St');

      // The picks render as chips in the field itself...
      await waitFor(() => {
        expect(screen.getByText('101 - 123 Main St')).toBeInTheDocument();
        expect(screen.getByText('102 - 123 Main St')).toBeInTheDocument();
      });

      // ...and as `aria-selected` options in the listbox, which MUI closes after
      // every pick, so re-open it before asserting on them.
      await openPicker(unitSelect);
      await waitFor(() => {
        expect(screen.getAllByRole('option', { selected: true })).toHaveLength(2);
      });
    });
  });

  describe('Validation Tests', () => {
    it('shows validation errors for required fields in assign mode', async () => {
      // `unitId` is deliberately omitted here. When it is supplied the modal
      // pre-selects that unit (`initialValues.unitId = unitId || ''`), so the
      // `unitId` required check can never fail and "Unit is required" would
      // never render.
      renderWithProviders(<AssignmentModal {...defaultProps} unitId={undefined} />);

      fireEvent.click(screen.getByRole('button', { name: /^assign$/i }));

      await waitFor(() => {
        expect(screen.getByText('Unit is required')).toBeInTheDocument();
        expect(screen.getByText('Lease start is required')).toBeInTheDocument();
        expect(screen.getByText('Lease end is required')).toBeInTheDocument();
      });
    });

    it('validates lease end is after lease start', async () => {
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      const unitSelect = getPicker();
      await selectOption(unitSelect, '101 - 123 Main St');

      fireEvent.change(screen.getByLabelText(/lease start/i), { target: { value: '2024-01-15' } });
      fireEvent.change(screen.getByLabelText(/lease end/i), { target: { value: '2024-01-10' } });

      fireEvent.click(screen.getByRole('button', { name: /^assign$/i }));

      await waitFor(() => {
        expect(screen.getByText('End date must be after start')).toBeInTheDocument();
      });
    });

    it('requires at least one unit in bulk mode', async () => {
      const bulkProps = { ...defaultProps, mode: 'bulk' as const, tenantIds: ['t1'] };
      renderWithProviders(<AssignmentModal {...bulkProps} />);

      fireEvent.click(screen.getByRole('button', { name: /assign bulk/i }));

      await waitFor(() => {
        expect(screen.getByText('At least one unit required')).toBeInTheDocument();
      });
    });
  });

  describe('Submit Tests', () => {
    it('submits assign form with valid data', async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<AssignmentModal {...defaultProps} onSubmit={mockOnSubmit} />);

      const unitSelect = getPicker();
      await selectOption(unitSelect, '101 - 123 Main St');

      fireEvent.change(screen.getByLabelText(/lease start/i), { target: { value: '2024-01-15' } });
      fireEvent.change(screen.getByLabelText(/lease end/i), { target: { value: '2025-01-15' } });

      // See the bulk case below: wait for Formik's async validation to settle
      // before clicking, or the click lands on a disabled submit button.
      const submitButton = screen.getByRole('button', { name: /^assign$/i });
      await waitFor(() => expect(submitButton).toBeEnabled());
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          unitId: 'u1',
          unitIds: undefined,
          leaseStart: expect.any(Date),
          leaseEnd: expect.any(Date),
          tenantId: 't1',
          tenantIds: undefined,
          mode: 'assign',
        });
      });
    });

    it('submits bulk assign form with valid data', async () => {
      const mockOnSubmit = jest.fn();
      const bulkProps = { ...defaultProps, mode: 'bulk' as const, tenantIds: ['t1', 't2'], onSubmit: mockOnSubmit };
      renderWithProviders(<AssignmentModal {...bulkProps} />);

      const unitSelect = getPicker(/select units/i);
      await selectOption(unitSelect, '101 - 123 Main St');
      await selectOption(unitSelect, '102 - 123 Main St');

      fireEvent.change(screen.getByLabelText(/lease start/i), { target: { value: '2024-01-15' } });
      fireEvent.change(screen.getByLabelText(/lease end/i), { target: { value: '2025-01-15' } });

      // Formik validates asynchronously and `fireEvent` is not act-wrapped, so
      // wait for the form to settle. Clicking straight away lands on a submit
      // button still disabled by an earlier validation pass — the values are
      // already correct, the stale `errors` simply have not been replaced yet.
      const submitButton = screen.getByRole('button', { name: /assign bulk/i });
      await waitFor(() => expect(submitButton).toBeEnabled());
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          unitId: '',
          unitIds: ['u1', 'u2'],
          leaseStart: expect.any(Date),
          leaseEnd: expect.any(Date),
          tenantId: 't1',
          tenantIds: ['t1', 't2'],
          mode: 'bulk',
        });
      });
    });

    it('handles unassign confirmation flow', async () => {
      const mockOnSubmit = jest.fn();
      renderWithProviders(<AssignmentModal {...defaultProps} mode="unassign" onSubmit={mockOnSubmit} />);

      fireEvent.click(screen.getByRole('button', { name: /confirm unassign/i }));

      // The nested confirmation dialog. Anchored on purpose: the outer dialog
      // also has a "Confirm Unassign" button, so a loose /confirm/i matches two.
      const finalConfirm = () => screen.getByRole('button', { name: /^confirm$/i });
      await waitFor(() => expect(finalConfirm()).toBeInTheDocument());
      fireEvent.click(finalConfirm());

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          unitId: 'u1',
          unitIds: undefined,
          leaseStart: null,
          leaseEnd: null,
          tenantId: 't1',
          // Omitted in non-bulk modes, matching the assign-mode assertion above.
          tenantIds: undefined,
          mode: 'unassign',
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles API error when fetching unit options', async () => {
      mockGetVacantUnitOptions.mockRejectedValue(new Error('Failed to fetch units'));
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch units')).toBeInTheDocument();
      });
    });

    it('enables submit while the form is untouched, then disables it after a failed submit', async () => {
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      // Formik initialises `errors` to `{}`, so `isValid` is true on mount and
      // the button starts ENABLED. It only becomes disabled once a submit has
      // been attempted and validation has failed.
      const submitButton = screen.getByRole('button', { name: /^assign$/i });
      expect(submitButton).toBeEnabled();

      fireEvent.click(submitButton);

      await waitFor(() => expect(submitButton).toBeDisabled());
    });

    it('closes modal on cancel', async () => {
      const mockOnClose = jest.fn();
      renderWithProviders(<AssignmentModal {...defaultProps} onClose={mockOnClose} />);

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles empty unit options', async () => {
      mockGetVacantUnitOptions.mockResolvedValue([]);
      renderWithProviders(<AssignmentModal {...defaultProps} />);

      // Deliberately not `openPicker`: with an empty option list MUI still
      // renders the "No options" row but does not flip `aria-expanded` to
      // "true", so waiting on that attribute would time out.
      fireEvent.mouseDown(getPicker());

      await waitFor(() => {
        expect(screen.getByText('No options')).toBeInTheDocument();
      });
    });
  });
});
