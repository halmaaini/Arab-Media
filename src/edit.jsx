/* edit.jsx — on-page inline editing (Phase 1–2 of the visual editor).
 *
 * EditableText is the core click-to-edit primitive: plain text normally; in edit
 * mode it becomes a contentEditable region that saves on blur via the supplied
 * onSave. Two convenience wrappers build on it:
 *   - <Editable page k>   → edits page copy (content[page][k]) via updatePageContent.
 *   - callers pass value+onSave directly for summary fields (updateSummary).
 *
 * Edit mode is a global flag on the content context, toggled by <EditModeBar>.
 * (In production, entering edit mode is gated behind admin auth.)
 */
import { useContent } from './content.jsx';
import { Icon } from './utils.jsx';

export function EditableText({ value, onSave, as = 'span', className, style, multiline = false }) {
  const { editMode } = useContent();
  const Tag = as;
  const text = value || '';
  if (!editMode) return <Tag className={className} style={style}>{text}</Tag>;
  return (
    <Tag
      className={(className ? className + ' ' : '') + 'mze-editable'}
      style={style}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      tabIndex={0}
      title="انقر للتعديل"
      ref={(el) => { if (el && el.dataset.init !== '1') { el.innerText = text; el.dataset.init = '1'; } }}
      onClick={(e) => e.stopPropagation()}                /* don't trigger parent nav/cards/play */
      onMouseDown={(e) => e.stopPropagation()}
      onBlur={(e) => onSave(e.currentTarget.innerText.trim())}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
        if (e.key === 'Escape') e.currentTarget.blur();
      }}
    />
  );
}

/* Page-copy convenience: binds to content[page][k] + updatePageContent. */
export function Editable({ page, k, as = 'span', className, style, multiline = false }) {
  const { content, updatePageContent } = useContent();
  const value = (content[page] && content[page][k]) || '';
  return (
    <EditableText
      value={value}
      onSave={(v) => updatePageContent(page, k, v)}
      as={as}
      className={className}
      style={style}
      multiline={multiline}
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
      <span className="row" style={{ gap: 8 }}><Icon name="edit" size={16} /> وضع التحرير — انقر أيّ نصّ لتعديله، واسحب أقسام الرئيسية لإعادة ترتيبها</span>
      <button className="btn btn-primary btn-sm" onClick={() => setEditMode(false)}>تمّ</button>
    </div>
  );
}
