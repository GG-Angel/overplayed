import { cn } from "@/lib/utils";
import type { IconComponent } from "@/types/icon";
import Card, { type CardProps } from "./Card";
import CardHeading from "./CardHeading";

export type StatusCardProps = CardProps & {
  icon: IconComponent;
  title: string;
};

const StatusCard = ({ icon, title, className, children, ...props }: StatusCardProps) => (
  <Card padding="lg" radius="lg" className={cn("flex flex-col gap-2", className)} {...props}>
    <CardHeading icon={icon}>{title}</CardHeading>
    {children}
  </Card>
);

export default StatusCard;
