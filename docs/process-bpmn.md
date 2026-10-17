# To-be process (BPMN v2)

How an owner tests a business decision with Business Twin. Source: `docs/bpmn/Business_Twin_BPMN_v2.bpmn` (open in bpmn.io or Camunda Modeler).

Every **service task** in the Business Twin lane is a backend responsibility; every **user task** is a screen or form in the web app.

## Lanes

- Salon owner
- Business Twin (web app)
- Adviser (optional)

## Flow

1. *Start:* a business decision to consider.
2. **Owner:** gather current figures (bookings, sales, staff hours, costs, cash).
3. **Owner:** enter today's monthly baseline (add past months if available).
4. **App:** label inputs and calculate the baseline: customers served, sales, costs, monthly result.
5. **App:** show the baseline dashboard and business map.
6. **Owner:** check the baseline figures on the dashboard.
7. *Gateway: Is the baseline correct?* No → correct figures (back to 3). Yes → continue.
8. **App:** show available changes: hire a worker, change price, more marketing.
9. **Owner:** browse the available changes and choose one to add.
10. *Gateway: Which change to add?*
    - Hire a worker → **Owner:** enter start month, hours, cost, expected customers and share that are new.
    - Change price → **Owner:** enter new price and expected change in demand.
    - More marketing → **Owner:** enter campaign cost and expected new customers.
11. **App:** add the change to the scenario and show the scenario summary.
12. **Owner:** review the changes in the scenario.
13. *Gateway: Add another change?* Yes → back to 8. No → build scenario.
14. **App:** build pessimistic, expected and optimistic cases.
15. **App:** simulate the coming months: capacity, sales, costs and cash; flag any cash shortfall.
16. **App:** compare with the baseline and explain the key drivers.
17. **Owner:** review results and assumptions.
18. *Gateway: What is the next step?*
    - Adjust estimates → **Owner:** adjust estimates for this scenario → recalculate (back to 14).
    - Test another scenario → back to 8.
    - Plan is ready → **Owner:** save plan.
19. *Gateway: Discuss with adviser?* Yes → **Adviser:** review saved plan with owner. No → continue.
20. **Owner:** make the decision (outside the tool). *End:* decision taken.

## Mapping to the system

| BPMN step | Web app | API / engine |
|---|---|---|
| Enter baseline | Baseline form (sample values marked) | Business & Baseline endpoints |
| Label inputs, calculate baseline, show dashboard | Baseline dashboard, business map | Engine baseline run |
| Show changes / choose / enter details | Scenario builder, change forms | Scenario & Change endpoints |
| Build cases, simulate, compare, explain | Comparison view, charts, explanation panel | Results endpoint → Case Builder, Cash-flow Simulator, Driver Explainer |
| Adjust estimates, recalculate | Inline edits in the comparison view | Results recalculated on each request |
| Save plan | Saved plans page | Save plan endpoint (scenario status draft → saved) |

## Diagram rules Krasi uses

If you edit the BPMN: gateways drawn large with the question inside; every gateway has at least two outcomes (no merge-only gateways); no two gateways in a row (an owner task makes each decision); "adjust estimates" loops back to recalculation, not to choosing the decision.
