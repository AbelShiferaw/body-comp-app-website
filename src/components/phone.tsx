import Image, { type StaticImageData } from "next/image";

type PhoneProps = {
  /** Screenshot shown in light mode (and in dark mode when `dark` is not given). */
  light: StaticImageData;
  /** Optional dark-mode screenshot of the same screen. */
  dark?: StaticImageData;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

/** An app screenshot in a simple phone frame. */
export function Phone({
  light,
  dark,
  alt,
  priority,
  sizes = "(min-width: 1024px) 300px, 70vw",
  className = "",
}: PhoneProps) {
  return (
    <div
      className={`relative aspect-[390/844] rounded-[2.6rem] border-[9px] border-[#16181c] bg-[#16181c] shadow-2xl shadow-black/25 ring-1 ring-outline ${className}`}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[2rem]">
        <Image
          src={light}
          alt={alt}
          priority={priority}
          sizes={sizes}
          className={`h-full w-full object-cover ${dark ? "dark:hidden" : ""}`}
        />
        {dark && (
          <Image
            src={dark}
            alt={alt}
            priority={priority}
            sizes={sizes}
            className="hidden h-full w-full object-cover dark:block"
          />
        )}
      </div>
    </div>
  );
}
