# Storage UI — shadcn/ui Theme

Dựa trên thiết kế **mobile storage manager** với phong cách clean, airy và vibrant color categories.

---

## Triết lý thiết kế

| Thuộc tính | Lựa chọn | Lý do |
|---|---|---|
| **Background** | Cool gray `#F2F4F8` | Tạo độ sâu, card trắng nổi bật |
| **Cards** | Pure white + subtle shadow | Neumorphic-lite, tách lớp rõ ràng |
| **Primary** | Electric Indigo `#4F46E5` | Accent chủ đạo, dùng cho CTA & ring |
| **Accent** | Cyan `#06D6F0` | Category màu đầu (Images) |
| **Radius** | `1rem` (16px) | Rounded, friendly — đồng nhất toàn theme |
| **Buttons** | Pill shape (`border-radius: 999px`) | Nhất quán với icon-button tròn trong UI |

---

## Cài đặt vào dự án shadcn

### 1. Thêm vào `globals.css`

```css
/* Paste toàn bộ nội dung file storage-theme.css vào đây */
```

### 2. Cấu hình `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
}
export default config
```

---

## Màu sắc theo danh mục (Category Colors)

Dùng cho icon wrapper của từng loại storage item:

```tsx
// tailwind classes
const categoryColors = {
  images:  "bg-[hsl(191_96%_92%)] text-[hsl(191_96%_35%)]",
  videos:  "bg-[hsl(238_82%_94%)] text-[hsl(238_82%_50%)]",
  apps:    "bg-[hsl(262_71%_93%)] text-[hsl(262_71%_50%)]",
  mail:    "bg-[hsl(27_96%_92%)]  text-[hsl(27_96%_45%)]",
  files:   "bg-[hsl(3_89%_93%)]   text-[hsl(3_89%_50%)]",
  others:  "bg-[hsl(220_14%_91%)] text-[hsl(220_14%_50%)]",
}
```

Hoặc dùng utility class từ file CSS:

```tsx
<div className="icon-images rounded-2xl p-3">
  <ImageIcon />
</div>
```

---

## Progress Bar — Multicolor

```tsx
// Thêm class custom để override màu progress
<Progress value={68} className="storage-bar" />
```

```css
/* CSS đã có sẵn trong theme — override màu của Progress */
[data-slot="progress"] > div {
  background: linear-gradient(to right,
    hsl(var(--chart-1))  0%  22%,
    hsl(var(--chart-2)) 22%  46%,
    hsl(var(--chart-3)) 46%  66%,
    hsl(var(--chart-4)) 66%  80%,
    hsl(var(--chart-5)) 80% 100%
  );
}
```

---

## Ví dụ component: Storage Card

```tsx
import { Card, CardContent } from "@/components/ui/card"
import { HardDrive } from "lucide-react"

export function StorageCard({ label, size, colorClass }: {
  label: string
  size: string
  colorClass: string
}) {
  return (
    <Card className="cursor-pointer">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
          <HardDrive className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="text-sm font-bold text-foreground mt-0.5">{size}</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## Tóm tắt token quan trọng

```
--background     220 20% 96%    Cool gray page bg
--card           0 0% 100%      White card surface  
--primary        238 82% 62%    Indigo — CTA, ring, active state
--accent         191 96% 52%    Cyan — highlight, first category
--chart-1..5     5 màu dải cầu vồng cho progress bar
--radius         1rem           Border radius chung
```
