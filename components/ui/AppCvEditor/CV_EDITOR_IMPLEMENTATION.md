# CV Editor Implementation

## Overview

A WYSIWYG curriculum vitae (CV) editor with drag-and-drop functionality, fixed slots, autosave, and multiple export formats. The editor renders a DIN-A4 page preview and saves to the same artifact storage system used by cover letters.

## Features

### ✅ Core Features
- **DIN-A4 WYSIWYG Preview**: Real-time A4-sized page rendering with proper scaling
- **Fixed Slots**: Three predefined sections (Education, Work Experience, Skills)
- **Drag & Drop**: Drag items from palette into slots and reorder within slots
- **Autosave**: 1-second debounced save to backend API
- **Personal Info Prefill**: Automatically populates header and palette from `/api/personal`
- **Template Support**: Template selection stored as `data-template` attribute
- **Client-Only Exports**: HTML download, PDF (print), and DOCX generation

### 🎯 Storage Format
- Same as cover letters: HTML string stored in `job.artifacts[]` array
- Artifact type: `'cv'`
- API endpoint: `POST/PUT /api/jobs/[id]/artifacts`
- In-memory: JSON model for editing
- On-disk: Serialized HTML with inline styles and data attributes for rehydration

## File Structure

```
components/ui/
  AppCvEditor/
    AppCvEditor.tsx           # Main editor component with DnD context
    appCvEditorPalette.tsx    # Left palette with draggable items
    appCvEditorSlot.tsx       # Drop zone for fixed slots with sorting
    appCvEditorPreview.tsx    # A4 WYSIWYG preview with editable header
    index.tsx                 # Barrel export
  appSafeHtml.tsx             # HTML sanitization wrapper using DOMPurify

app/jobs/[id]/write/cv/
  page.tsx                    # CV editor page route with autosave

lib/
  cvModel.ts                  # CV model types, serialization, and parsing utilities
```

## Architecture

### Data Flow

1. **Load**: Fetch job artifact (HTML) → Parse into JSON model → Initialize editor
2. **Edit**: User drags/drops items → JSON model updates → Serialize to HTML
3. **Save**: Debounce (1s) → POST/PUT to `/api/jobs/[id]/artifacts` with `type: 'cv'`
4. **Unload**: Flush pending changes via `sendBeacon` on beforeunload

### CV Model (In-Memory)

```typescript
type CvModel = {
  templateId: 'modern' | 'classic' | 'minimal';
  header: {
    name: string;
    email: string;
    phone: string;
    location?: string;
  };
  slots: {
    education: CvEducationItem[];
    experience: CvExperienceItem[];
    skills: CvSkillItem[];
  };
};
```

### HTML Serialization

The JSON model is serialized to HTML with:
- Root `<div data-template="modern">` for template tracking
- Inline styles for consistent rendering across browsers and exports
- `data-slot` and `data-item-id` attributes for rehydration
- Minimal tag set: `div`, `section`, `h1-h3`, `p`, `ul/ol/li`, `strong/em`, `br`

### Sanitization

- Uses `DOMPurify` (dynamically imported) with explicit allowlist
- Allowed tags: `div`, `section`, `h1-h3`, `p`, `ul`, `ol`, `li`, `strong`, `em`, `br`, `span`
- Allowed attributes: `style`, `data-template`, `data-slot`, `data-item-id`, `class`
- Applied before preview rendering and before any export

## Usage

### Accessing the Editor

1. Navigate to a job detail page: `/jobs/[id]`
2. Scroll to "Job Artifacts" section
3. Click "Add CV" button (or "Edit" if CV exists)
4. Opens `/jobs/[id]/write/cv`

### Editing Workflow

1. **Header**: Click inline inputs to edit name, email, phone, location
2. **Add Items**: Drag items from left palette into the three fixed slots
3. **Reorder**: Drag items within a slot to reorder
4. **Remove**: Hover over item and click X button
5. **Template**: Click Modern/Classic/Minimal buttons to change styling
6. **Autosave**: Changes save automatically after 1 second

### Exporting

- **HTML**: Downloads sanitized HTML file
- **PDF**: Opens print dialog (use "Save as PDF" in browser)
- **DOCX**: Generates Word document using `html-docx-js-typescript`

## Dependencies

### New Dependencies Added

```json
{
  "@dnd-kit/core": "^*",
  "@dnd-kit/sortable": "^*",
  "@dnd-kit/utilities": "^*",
  "dompurify": "^*",
  "@types/dompurify": "^*",
  "html-docx-js-typescript": "^*"
}
```

### Why These Libraries?

- **@dnd-kit**: Modern, accessible drag-and-drop with excellent TypeScript support
- **dompurify**: Industry-standard HTML sanitizer for XSS prevention
- **html-docx-js-typescript**: Lightweight HTML→DOCX converter that works in-browser

## API Integration

### Save Artifact

```typescript
PUT /api/jobs/[id]/artifacts
Content-Type: application/json

{
  "type": "cv",
  "content": "<div data-template=\"modern\">...</div>"
}
```

**Response**: `200 OK` with updated artifact object

### Load Artifact

Fetched as part of job object via `useLoadJob(jobId)` hook:

```typescript
job.artifacts?.find(a => a.type === 'cv')?.content
```

### Personal Information

Fetched via `usePersonal()` hook which calls `GET /api/personal`:

- `personal.contact`: name, email, phone
- `personal.education`: array of education items
- `personal.experience`: array of work experience items
- `personal.skills`: array of skill items

## Print Support

Reuses existing print CSS from `app/globals.css`:

- `.print:visible` class makes elements visible when printing
- Other elements hidden via `@media print { body * { visibility: hidden; } }`
- Applied to CV page wrapper and A4 preview

## Security

### HTML Sanitization

1. **Generation**: CV model serializes to minimal HTML (limited tag set)
2. **Storage**: Raw HTML stored in database (trusted source: our serializer)
3. **Rendering**: Always sanitized via `AppSafeHtml` component before display
4. **Export**: Sanitized again before HTML/DOCX export

### XSS Prevention

- Explicit allowlist: only tags/attributes we generate are preserved
- `DOMPurify.sanitize()` with strict config
- No user-provided HTML accepted (only structured data via drag/drop)

## Performance

### Bundle Size Optimization

- **Dynamic Imports**: `DOMPurify` and `html-docx-js-typescript` loaded on-demand
- **Lazy Loading**: DOCX library only imported when export button clicked
- **Debounced Save**: Reduces API calls during rapid editing

### A4 Rendering

- Fixed mm-based dimensions (210mm × 297mm)
- CSS-only scaling (no canvas/image rendering)
- Print-optimized: no JS required for PDF export

## Accessibility

- **Keyboard Navigation**: Full keyboard support via `@dnd-kit/core`
- **Screen Readers**: ARIA labels on all interactive elements
- **Focus Management**: Visible focus indicators on all controls
- **Semantic HTML**: Proper heading hierarchy and landmarks

## Future Enhancements

### Template System

- Currently: inline styles only
- Future: External stylesheets with template switcher
- Store template choice in `data-template` for easy migration

### DOCX Fidelity

- Current: `html-docx-js` (simple, fast, limited fidelity)
- Fallback: `docx` library (better fidelity, heavier, needs custom mapping)
- Add opt-in "High Fidelity DOCX" export if needed

### Advanced Features

- **Rich Text Editing**: Per-item description editing with formatting
- **Custom Sections**: User-defined sections beyond Education/Experience/Skills
- **AI Suggestions**: Generate CV content from job description
- **Version History**: Track CV changes over time
- **Collaborative Editing**: Real-time multiplayer editing

## Testing

### Manual Testing

1. **Create CV**: Add items from palette to slots
2. **Reorder**: Drag items within slots
3. **Remove**: Click X to remove items
4. **Header**: Edit inline fields
5. **Template**: Switch between templates
6. **Autosave**: Verify "Saved" indicator appears
7. **Reload**: Refresh page and verify CV persists
8. **Export HTML**: Download and verify HTML structure
9. **Export PDF**: Print to PDF and verify layout
10. **Export DOCX**: Download and open in Word

### Edge Cases

- Empty CV (no items added)
- All slots filled (maximum items)
- Long content (multi-page CV)
- Special characters in text
- Browser refresh during autosave
- Network errors during save

## Troubleshooting

### TypeScript Errors

- Ensure all files use camelCase (except AppCvEditor.tsx for component name)
- Restart TS server if file rename issues persist

### Print Issues

- Verify `.print:visible` class on page wrapper
- Check browser print preview settings
- Ensure A4 size selected in print dialog

### DOCX Export Failures

- Check browser console for import errors
- Verify `html-docx-js-typescript` is installed
- Try fallback: copy HTML and paste into Word

### Autosave Not Working

- Check network tab for API errors
- Verify `useDebounce` is triggering (1000ms delay)
- Check `pendingPayloadRef` is being set

## Related Files

- Cover letter editor: `app/jobs/[id]/write/cover/page.tsx`
- Artifact API: `app/api/jobs/[id]/artifacts/route.ts`
- Personal API: `app/api/personal/route.ts`
- Job detail page: `app/jobs/[id]/page.tsx`
- Artifact UI: `components/ui/appJobArtifactEditor.tsx`

## Summary

The CV editor is a complete, production-ready feature that:
- ✅ Uses the same storage format as cover letters
- ✅ Provides a WYSIWYG DIN-A4 preview
- ✅ Supports drag-and-drop with fixed slots
- ✅ Autosaves with debounce + unload flush
- ✅ Prefills from personal information API
- ✅ Exports to HTML, PDF, and DOCX
- ✅ Sanitizes HTML for security
- ✅ Follows project TypeScript/React/Next.js conventions
- ✅ Optimized for performance and accessibility
