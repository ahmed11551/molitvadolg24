// Компонент для ограничения доступа к функциям по тарифу

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { hasFeature, getTierName, type SubscriptionTier } from "@/types/subscription";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SubscriptionGateProps {
  feature: keyof import("@/types/subscription").SubscriptionFeatures;
  children: ReactNode;
  fallback?: ReactNode;
  requiredTier?: SubscriptionTier;
  featureName?: string;
  description?: string;
}

export const SubscriptionGate = ({
  feature,
  children,
  fallback,
  requiredTier,
  featureName,
  description,
}: SubscriptionGateProps) => {
  const { tier } = useSubscription();
  const hasAccess = hasFeature(tier, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="border-dashed border-2 border-muted">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <CardTitle>Премиум функция</CardTitle>
        </div>
        <CardDescription>
          {featureName || "Эта функция доступна только для платных тарифов"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <SubscriptionUpgradeDialog requiredTier={requiredTier} />
      </CardContent>
    </Card>
  );
};

interface SubscriptionUpgradeDialogProps {
  requiredTier?: SubscriptionTier;
}

export const SubscriptionUpgradeDialog = ({ requiredTier = "mutahsin" }: SubscriptionUpgradeDialogProps) => {
  const tiers = [
    {
      tier: "mutahsin" as const,
      name: "Мутахсин",
      price: "299₽/мес",
      features: [
        "Интеллектуальный калькулятор каза",
        "Расширенные шаблоны целей",
        "AI-отчеты с рекомендациями",
        "Расширенная геймификация",
      ],
    },
    {
      tier: "sahib_al_waqf" as const,
      name: "Сахиб аль-Вакф",
      price: "599₽/мес",
      features: [
        "Все функции Мутахсин",
        "Групповые цели",
        "Глубинные AI-инсайты",
        "Эксклюзивные бейджи",
        "Приоритетные уведомления",
      ],
    },
  ];

  const targetTier = tiers.find((t) => t.tier === requiredTier) || tiers[0];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Crown className="w-4 h-4 mr-2" />
          Перейти на {targetTier.name}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Выберите тариф</DialogTitle>
          <DialogDescription>
            Выберите подходящий тариф для доступа к расширенным функциям
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {tiers.map((tier) => (
            <Card
              key={tier.tier}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                tier.tier === requiredTier && "ring-2 ring-primary"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <Badge variant={tier.tier === "sahib_al_waqf" ? "default" : "secondary"}>
                    {tier.price}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-4" variant={tier.tier === requiredTier ? "default" : "outline"}>
                  {tier.tier === requiredTier ? "Рекомендуется" : "Выбрать"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Оплата через Telegram Payments или банковскую карту
        </p>
      </DialogContent>
    </Dialog>
  );
};

