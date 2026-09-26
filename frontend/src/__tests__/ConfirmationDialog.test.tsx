import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

describe("ConfirmationDialog Component", () => {
  it("renders modal when isOpen is true", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Validate Physical Receipt"
        description="This operation will increase stock balances in PostgreSQL and record a RECEIPT entry."
        confirmText="Validate Receipt"
      />
    );

    expect(screen.getByText("Validate Physical Receipt")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This operation will increase stock balances in PostgreSQL and record a RECEIPT entry."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Validate Receipt")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(
      <ConfirmationDialog
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Hidden Dialog"
        description="Should not appear in DOM"
      />
    );

    expect(screen.queryByText("Hidden Dialog")).not.toBeInTheDocument();
  });

  it("triggers onConfirm callback when confirm button is clicked", () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        title="Confirm Operation"
        description="Are you sure?"
        confirmText="Execute"
      />
    );

    const button = screen.getByText("Execute");
    fireEvent.click(button);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
