import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/ui/StatusBadge";

describe("StatusBadge Component", () => {
  it("renders DRAFT status badge correctly", () => {
    render(<StatusBadge status="DRAFT" />);
    expect(screen.getByText(/draft/i)).toBeInTheDocument();
  });

  it("renders WAITING status badge correctly", () => {
    render(<StatusBadge status="WAITING" />);
    expect(screen.getByText(/waiting/i)).toBeInTheDocument();
  });

  it("renders READY status badge correctly", () => {
    render(<StatusBadge status="READY" />);
    expect(screen.getByText(/ready/i)).toBeInTheDocument();
  });

  it("renders DONE status badge correctly", () => {
    render(<StatusBadge status="DONE" />);
    expect(screen.getByText(/done/i)).toBeInTheDocument();
  });

  it("renders CANCELED status badge correctly", () => {
    render(<StatusBadge status="CANCELED" />);
    expect(screen.getByText(/canceled/i)).toBeInTheDocument();
  });

  it("renders OUT_OF_STOCK critical badge correctly", () => {
    render(<StatusBadge status="OUT_OF_STOCK" />);
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  it("renders LOW_STOCK warning badge correctly", () => {
    render(<StatusBadge status="LOW_STOCK" />);
    expect(screen.getByText(/low stock/i)).toBeInTheDocument();
  });

  it("renders IN_STOCK badge correctly", () => {
    render(<StatusBadge status="IN_STOCK" />);
    expect(screen.getByText(/in stock/i)).toBeInTheDocument();
  });
});
