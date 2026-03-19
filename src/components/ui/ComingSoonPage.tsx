"use client";

import { useRouter } from "next/navigation";
import type { MessageKey } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";

import {
  ThemeCard,
  ThemeCardContent,
  ThemeCardDescription,
  ThemeCardFooter,
  ThemeCardHeader,
  ThemeCardTitle,
} from "@/components/theme/Card";
import { ThemeButton } from "@/components/theme/Button";

type ComingSoonPageProps = {
  titleKey: MessageKey;
  descriptionKey?: MessageKey;
  backHref?: string;
  backLabelKey?: MessageKey;
};

export function ComingSoonPage({
  titleKey,
  descriptionKey,
  backHref = "/",
  backLabelKey = "comingSoon.backToVault",
}: ComingSoonPageProps) {
  const router = useRouter();
  const { t } = useLocale();

  return (
    <div className="min-h-[100dvh] bg-background px-4 py-10 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:px-6 sm:py-14">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <ThemeCard className="border border-border/70 bg-card">
          <ThemeCardHeader className="space-y-1">
            <ThemeCardTitle className="text-2xl sm:text-3xl">
              {t(titleKey)}
            </ThemeCardTitle>
            {descriptionKey ? (
              <ThemeCardDescription className="text-sm sm:text-base">
                {t(descriptionKey)}
              </ThemeCardDescription>
            ) : null}
          </ThemeCardHeader>
          <ThemeCardContent>
            <div className="rounded-[var(--radius)] border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              {t("comingSoon.description")}
            </div>
          </ThemeCardContent>
          <ThemeCardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start">
            <ThemeButton
              type="button"
              size="lg"
              onClick={() => router.push(backHref)}
              className="w-full sm:w-auto"
            >
              {t(backLabelKey)}
            </ThemeButton>
          </ThemeCardFooter>
        </ThemeCard>
      </div>
    </div>
  );
}
