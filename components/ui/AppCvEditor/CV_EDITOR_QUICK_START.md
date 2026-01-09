# CV Editor - Quick Start Guide

## How to Test the CV Editor

### Prerequisites

1. Ensure the development server is running:
   ```bash
   npm run dev
   ```

2. Ensure you have personal information in the database (for prefilling):
   - Navigate to `/personal` and add education, experience, and skills
   - Or use mock data endpoints if available

### Testing Steps

#### 1. Access the Editor

1. Navigate to any job detail page: `http://localhost:3000/jobs/{job-id}`
2. Scroll to the "Job Artifacts" section
3. Click the "Add CV" button (or "Edit" if a CV already exists)
4. You should land on `/jobs/{job-id}/write/cv`

#### 2. Edit the CV

**Header Section:**
- Click on the name field and type your name
- Click on email and phone fields to edit
- Values autosave after 1 second (watch for green "Saved" indicator)

**Add Items from Palette:**
- On the left side, you'll see three sections:
  - Education
  - Work Experience  
  - Skills
- Drag an item from the palette onto the corresponding slot in the A4 preview
- Items turn gray in palette once placed
- Watch for the green "Saved" indicator after each change

**Reorder Items:**
- Within each slot, drag items up/down to reorder
- The new order saves automatically

**Remove Items:**
- Hover over an item in a slot
- Click the X button that appears
- Item returns to the palette and can be dragged again

#### 3. Change Templates

- Click "Modern", "Classic", or "Minimal" buttons at the top
- The template choice is saved with your CV
- Inline styles ensure consistent rendering across exports

#### 4. Export Your CV

**HTML Export:**
1. Click "HTML" button
2. Browser downloads `cv.html`
3. Open in any browser to view

**PDF Export:**
1. Click "PDF" button
2. Print dialog opens
3. Select "Save as PDF" as destination
4. Adjust settings if needed (margins, orientation)
5. Click "Save" or "Print"

**DOCX Export:**
1. Click "DOCX" button
2. Browser downloads `cv.docx`
3. Open in Microsoft Word or compatible editor
4. Note: Fidelity may vary; use PDF for guaranteed layout

#### 5. Test Autosave

**Normal Save:**
1. Make a change (drag item, edit header)
2. Wait 1 second
3. Look for "Saving..." → "Saved" indicator in top-right
4. Refresh the page
5. Verify your changes persisted

**Unload Save:**
1. Make a change
2. Immediately close the tab or navigate away (before 1 second)
3. Reopen the CV editor
4. Verify the change was saved via `sendBeacon`

### Common Issues

**"Loading job details..." stays forever:**
- Check that the job ID exists in the database
- Check browser console for API errors

**"Personal information not found":**
- Add personal data at `/personal` first
- Or check `/api/personal` returns valid data

**Items not draggable:**
- Items already placed in slots are grayed out
- Remove from slot first, then drag again

**Autosave indicator stuck on "Saving...":**
- Check Network tab for failed API requests
- Verify MongoDB is running and accessible
- Check `DATABASE_NAME` environment variable

**Export buttons don't work:**
- Check browser console for import errors
- Try refreshing the page
- For DOCX: ensure `html-docx-js-typescript` is installed

### Verify Implementation

Run these checks:

```bash
# Check TypeScript compilation
npm run build

# Check for CV-related errors only
npx tsc --noEmit | grep -E "(cvModel|AppCvEditor|write/cv)"

# Expected: No errors (or only unrelated errors)
```

### Manual Test Checklist

- [ ] CV editor page loads without errors
- [ ] Personal info appears in palette (education, experience, skills)
- [ ] Header fields are editable and save
- [ ] Drag education item to Education slot works
- [ ] Drag experience item to Experience slot works
- [ ] Drag skill item to Skills slot works
- [ ] Reorder items within a slot works
- [ ] Remove item from slot works (X button)
- [ ] Template switcher changes styling
- [ ] Autosave indicator shows "Saving..." then "Saved"
- [ ] Page refresh preserves changes
- [ ] HTML export downloads valid file
- [ ] PDF export opens print dialog
- [ ] DOCX export downloads valid file
- [ ] Navigate away without waiting saves via sendBeacon
- [ ] A4 preview looks professional and print-ready

### Next Steps

Once basic functionality is verified:

1. **Add Content**: Populate your CV with real data
2. **Customize Templates**: Adjust inline styles in `lib/cvModel.ts` serialization
3. **Test Edge Cases**: Very long content, special characters, empty CV
4. **Mobile Testing**: Verify responsive behavior on smaller screens
5. **Cross-Browser**: Test in Chrome, Firefox, Safari, Edge

### Getting Help

If you encounter issues:

1. Check browser console for errors
2. Check Network tab for failed API requests
3. Review `/CV_EDITOR_IMPLEMENTATION.md` for architecture details
4. Check `/lib/cvModel.ts` for serialization logic
5. Review component props in `/components/ui/AppCvEditor/`

## Success Criteria

Your CV editor is working correctly when:

✅ You can drag items from palette into slots  
✅ You can reorder items within slots  
✅ You can remove items from slots  
✅ Changes autosave within 1 second  
✅ Page refresh preserves your CV  
✅ All three export formats work (HTML, PDF, DOCX)  
✅ Template switcher changes the styling  
✅ No TypeScript compilation errors  
✅ No runtime errors in browser console  

Congratulations! Your CV editor is ready to use. 🎉
