import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

describe("Breadcrumbs Component", () => {
  it("renders correct hierarchy for dashboard route", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders correct hierarchy for delivery orders route", () => {
    render(
      <MemoryRouter initialEntries={["/operations/deliveries"]}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(screen.getByText("Delivery Orders")).toBeInTheDocument();
  });

  it("renders correct hierarchy for low stock alerts route", () => {
    render(
      <MemoryRouter initialEntries={["/alerts/low-stock"]}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByText("Stock Health")).toBeInTheDocument();
    expect(screen.getByText("Low Stock Detection")).toBeInTheDocument();
  });
});
