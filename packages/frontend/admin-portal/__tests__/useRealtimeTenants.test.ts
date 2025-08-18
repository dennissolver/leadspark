import { useRealtimeTenants } from "../hooks/useRealtimeTenants";
import { renderHook } from "@testing-library/react";

test("initializes with tenants", () => {
  const { result } = renderHook(() =>
    useRealtimeTenants(
      [{ id: "t1", name: "Test Tenant", subscriptionStatus: "trialing", leadCount: 5 }],
      {}
    )
  );
  expect(result.current.tenants.length).toBe(1);
});