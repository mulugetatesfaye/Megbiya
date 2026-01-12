import { Button } from "@base-ui/react";

function MobileCheckoutBar({
  total,
  disabled,
  onContinue,
}: {
  total: string;
  disabled: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 md:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-semibold">{total}</p>
        </div>
        <Button disabled={disabled} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
