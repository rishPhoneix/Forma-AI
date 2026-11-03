# Forma AI — Design System and Visual Direction

## 1. Visual direction

Use the supplied dashboard references as inspiration, not as templates to copy.

### Dark mode
- Deep charcoal/near-black canvas.
- Layered dark surfaces and subtle borders.
- Strong text contrast.
- Restrained teal/sage accents and occasional soft glow.
- Dense data areas remain legible and organized.

### Light mode
- Warm off-white or cream canvas.
- White or lightly tinted cards.
- Generous spacing and clear hierarchy.
- Restrained sage/teal accents with soft warm-yellow highlights.
- Avoid excessive shadows and low-contrast pale text.

Preserve Forma AI's established brand identity: teal, sage, warm brown, and light neutral text. Avoid making purple the primary brand colour.

## 2. Proposed semantic tokens

The following values are starting points for design exploration. They must be contrast-tested and refined during implementation.

### Dark theme

| Token | Proposed value |
|---|---|
| Background | `#091011` |
| Surface | `#121C1D` |
| Surface elevated | `#192627` |
| Text | `#ECF4F4` |
| Muted text | `#A8B9B8` |
| Primary | `#A7CACD` |
| Secondary | `#624437` |
| Accent | `#A0B479` |
| Border | `#263536` |
| Danger | `#D96A6A` |

### Light theme

| Token | Proposed value |
|---|---|
| Background | `#F6F5EF` |
| Surface | `#FFFFFF` |
| Surface elevated | `#FBFCF9` |
| Text | `#202B29` |
| Muted text | `#687572` |
| Primary | `#668F89` |
| Secondary | `#9B7965` |
| Accent | `#D9C66B` |
| Border | `#E5E7DF` |
| Danger | `#B94B4B` |

## 3. Theme modes

Support:
- Light
- Dark
- System

Expected behaviour:
- Header toggle provides quick switching.
- Settings provides the full preference control.
- System mode follows operating-system preference.
- Theme applies consistently to every route, modal, chart, form renderer, and NOVA interface.
- Preference persists after refresh.
- Signed-in preference should sync through the user profile when account preference storage is implemented.
- Local preference may be used for immediate rendering and signed-out continuity.

Define tokens centrally with CSS custom properties. Components must consume semantic tokens rather than hard-coded theme colours.

## 4. Layout principles

- Consistent application shell with shared sidebar and header.
- Predictable content width and spacing.
- Responsive navigation for smaller screens.
- Clear page titles, breadcrumbs where useful, and contextual actions.
- Cards should group related information rather than decorate every element.
- Keep tables readable with overflow handling and responsive alternatives.
- Provide clear loading, empty, error, disabled, and success states.

## 5. Dashboard visual language

Use:
- Personalized welcome area.
- Large but restrained KPI cards.
- Recent forms and submissions tables/lists.
- Analytics charts with accessible labels.
- Quick actions and AI Magic Input.
- Notifications and activity feed.

Do not hard-code business metrics. Use live API data and explicit loading/empty/error states.

## 6. Component standards

Build reusable components for:
- Buttons and icon buttons.
- Inputs, selects, checkboxes, and textareas.
- Cards and statistic cards.
- Dialogs and confirmation modals.
- Toasts and notifications.
- Tabs, badges, tooltips, and dropdowns.
- Tables, pagination, and filters.
- Empty states and skeleton loaders.
- Chart containers.
- Assistant message and composer components.

## 7. Accessibility

- Keyboard navigation and visible focus.
- Semantic HTML and accessible labels.
- Sufficient text and control contrast in both themes.
- Reduced-motion support.
- Do not communicate status using colour alone.
- Dialog focus management and Escape handling.
- Charts need text summaries or accessible data alternatives.

## 8. Responsive behaviour

Test desktop, tablet, and mobile widths. The form-filling experience and assistant should be especially usable on narrow screens. Navigation should collapse deliberately rather than simply overflow.

## 9. Design QA checklist

- [ ] Light theme contrast checked.
- [ ] Dark theme contrast checked.
- [ ] Header, sidebar, and page content share tokens.
- [ ] NOVA floating and full-page interfaces follow the selected theme.
- [ ] Form builder and public renderer follow the selected theme.
- [ ] Charts and tables remain legible.
- [ ] Modal and dropdown layering is correct.
- [ ] Mobile layouts are usable.
- [ ] Keyboard and reduced-motion behaviour checked.
