import { createConfiguredPromoService } from "@/features/promos/service-factory";
import { createValidatePromoHandler } from "@/features/promos/validate-promo-handler";

export const runtime = "nodejs";
export const POST = createValidatePromoHandler(createConfiguredPromoService);
