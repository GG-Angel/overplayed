import Button from "@/components/ui/Button";

type NoChangesViewProps = {
  onBack?: () => void;
  onHome?: () => void;
};

const NoChangesView = ({ onBack, onHome }: NoChangesViewProps) => {
  return (
    <div className="flex flex-col h-full justify-center gap-6">
      <div className="text-center">
        <p className="text-4xl mb-2 text-primary">{"ദ്ദി(｡•̀ ,<)~✩‧₊"}</p>
        <p className="text-xl font-medium">Nothing to Remove!</p>
        <p>You kept every track, so your playlist stays as is.</p>
        <p className="text-sm text-muted-foreground">(your playlist must be really good)</p>
      </div>
      <div className="flex justify-center gap-2">
        <Button variant="secondary" onClick={onBack}>
          Keep Swiping
        </Button>
        <Button variant="primary" onClick={onHome}>
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default NoChangesView;
