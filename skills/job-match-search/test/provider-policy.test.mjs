import assert from "node:assert/strict";
import test from "node:test";
import {
  assertApprovedUse,
  PROVIDER_POLICIES,
} from "../scripts/provider-policy.mjs";

for (const [platform, policy] of Object.entries(PROVIDER_POLICIES)) {
  test(platform + " requires explicit approved-use confirmation", () => {
    assert.throws(
      () => assertApprovedUse(platform, {}),
      new RegExp(policy.approvalVariable),
    );
    assert.doesNotThrow(() =>
      assertApprovedUse(platform, {
        [policy.approvalVariable]: "true",
      }),
    );
    assert.doesNotThrow(() =>
      assertApprovedUse(platform, {
        [policy.approvalVariable]: " TRUE ",
      }),
    );
  });
}
