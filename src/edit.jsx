/* edit.jsx — on-page inline editing (Phase 1 of the visual editor).
 *
 * <Editable> renders plain text normally; in edit mode it becomes a
 * click-to-edit region (contentEditable) that saves to the SAME page-content
 * store (content[page][key]) used by the portal screen. Edit mode is a global
 * flag on the content context, toggled by <EditModeBar>.
 *
 * This is the foundation the later drag-reorder + curated per-section controls
 * bolt onto. (In production, entering edit mode is gated behind admin auth.)
 */
import { useContent } from './content.jsx';
import { Icon } from './utils.jsx';

export function Editable({ page, k, as = 'span', className, multiline = false }) {
  const { content, updatePageContent, editMode } = useContent();
  const value = (content[page] && content[page][k]) || '';
  const Tag = as;
  if (!editMode) return <Tag className={className}>{value}</Tag>;
  return (
    <Tag
      className={(className ? className + ' ' : '') + 'mze-editable'}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      tabIndex={0}
      title="انقر للتعديل"
      ref={(el) => { if (el && el.dataset.init !== '1') { el.innerText = value; el.dataset.init = '1'; } }}
      onClick={(e) => e.stopPropagation()}           /* don't trigger parent nav/cards */
      onBlur={(e) => updatePageContent(page, k, e.currentTarget.innerText.trim())}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
        if (e.key === 'Escape') e.currentTarget.blur();
      }}
    />
  );
}

export function EditModeBar() {
  const { editMode, setEditMode } = useContent();
  if (!editMode) {
    return (
      <button className="edit-fab" onClick={() => setEditMode(true)} title="تحرير محتوى الصفحة مباشرة">
        <Icon name="edit" size={18} /> تحرير الصفحة
      </button>
    );
  }
  return (
    <div className="edit-banner">
      <span className="row" style={{ gap: 8 }}><Icon name="edit" size={16} /> وضع التحرير — انقر أيّ نصّ لتعديله</span>
      <button className="btn btn-primary btn-sm" onClick={() => setEditMode(false)}>تمّ</button>
    </div>
  );
}
