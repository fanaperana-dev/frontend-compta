// ArivotekIcon.jsx — logo Arivotek
//
// PREREQUIS : deposer arivotek-logo.png et arivotek-symbol.png dans le dossier public/
//
// Import :
//   depuis src/pages/      ->  import ArivotekIcon from "../components/ArivotekIcon";
//   depuis src/components/ ->  import ArivotekIcon from "./ArivotekIcon";
//
// Usage :
//   <ArivotekIcon height={130} />                  logo complet (symbole + ARIVOTEK + by E&T)
//   <ArivotekIcon variant="symbol" height={36} />  symbole seul (barre laterale)

const SOURCES = {
  full: "/arivotek-logo.png",
  symbol: "/arivotek-symbol.png",
};

export default function ArivotekIcon({
  variant = "full",   // "full" = symbole + texte  |  "symbol" = symbole seul
  height,             // hauteur en px
  className = "",
  alt = "Arivotek",
  style = {},
  ...props
}) {
  const h = height ?? (variant === "symbol" ? 32 : 100);

  return (
    <img
      src={SOURCES[variant] ?? SOURCES.full}
      alt={alt}
      className={className}
      style={{
        height: h,
        width: "auto",
        display: "inline-block",
        objectFit: "contain",
        verticalAlign: "middle",
        ...style,
      }}
      {...props}
    />
  );
}
