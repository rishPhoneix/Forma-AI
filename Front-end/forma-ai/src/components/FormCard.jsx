import "./FormCard.css";

function FormCard({
  title,
  description,
  category,
  fields,
  onOpen,
}) {
  return (
    <article className="form-card">
      <div className="form-card-top">
        <span className="form-category">{category}</span>
        <span className="form-fields">{fields} fields</span>
      </div>

      <h3>{title}</h3>
      <p>{description}</p>

      <button
        type="button"
        className="form-card-button"
        onClick={onOpen}
      >
        Open Form <span>→</span>
      </button>
    </article>
  );
}

export default FormCard;