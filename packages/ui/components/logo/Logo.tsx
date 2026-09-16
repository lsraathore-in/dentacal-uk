import classNames from "@calcom/ui/classNames";

export function Logo({
  small,
  icon,
  inline = true,
  className,
  src = "/api/logo",
}: {
  small?: boolean;
  icon?: boolean;
  inline?: boolean;
  className?: string;
  src?: string;
}) {
  return (
    <h3 className={classNames("logo", inline && "inline", className)}>
      <strong>
        {icon ? (
          <img className="mx-auto w-9" alt="SmileSlot" title="SmileSlot" src="/smileslot-icon.svg" />
        ) : (
          <img
            className={classNames(small ? "h-6 w-auto" : "h-8 w-auto")}
            alt="SmileSlot"
            title="SmileSlot"
            src="/smileslot-logo.svg"
          />
        )}
      </strong>
    </h3>
  );
}
