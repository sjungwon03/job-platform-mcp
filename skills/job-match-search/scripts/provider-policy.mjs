export const PROVIDER_POLICIES = Object.freeze({
  wanted: Object.freeze({
    approvalVariable: "WANTED_API_USE_APPROVED",
    notice:
      "사업자등록번호·회사명·서비스 URL로 신청하고 현재 용도와 필요한 권한을 Wanted가 승인했어야 합니다.",
  }),
  saramin: Object.freeze({
    approvalVariable: "SARAMIN_API_USE_APPROVED",
    notice:
      "회사/학교·서비스 URL과 이용목적으로 승인을 받았어야 하며, 재판매·이용요금 부과는 서면 허가 없이는 허용되지 않습니다.",
  }),
  jobkorea: Object.freeze({
    approvalVariable: "JOBKOREA_API_USE_APPROVED",
    notice:
      "이용기관·서비스·서버 IP·이용목적으로 승인을 받고 고유 호출 URL을 발급받았어야 합니다.",
  }),
});

export function assertApprovedUse(platform, env = process.env) {
  const policy = PROVIDER_POLICIES[platform];
  if (!policy) throw new Error("Unknown provider: " + platform);
  if (
    env[policy.approvalVariable]?.trim().toLowerCase() !== "true"
  ) {
    throw new Error(
      "Set " +
        policy.approvalVariable +
        "=true only after the provider approved this service and use purpose",
    );
  }
}
