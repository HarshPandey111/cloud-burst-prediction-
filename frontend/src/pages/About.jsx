export default function About() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">About Cloud Burst Prediction</h1>

      <section className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Project overview</h2>
        <p>
          The Cloud Burst Prediction and Risk Analysis system is designed to provide early insight
          into intense, localized rainfall events that can trigger flash floods and infrastructure
          overload. It combines meteorological signals with machine learning to estimate both the
          probability of a cloud burst and an interpretable risk score on a 0–100 scale.
        </p>
      </section>

      <section className="mt-6 space-y-2 text-sm text-slate-700 dark:text-slate-300">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">How the ML model works</h2>
        <p>
          The backend uses a two-stage machine learning approach. First, a classification model
          (Random Forest and Gradient Boosting are evaluated, the best F1-score model is selected)
          predicts whether a cloud burst event is likely given features such as temperature,
          humidity, atmospheric pressure, wind speed, rainfall over the last 24 hours, cloud cover,
          dew point, and altitude.
        </p>
        <p>
          Second, a Gradient Boosting regressor estimates a continuous risk score between 0 and 100
          that reflects the severity of the detected conditions. Both models are trained on
          carefully designed synthetic weather scenarios that respect physical intuition: high
          humidity, intense rainfall, low pressure, and heavy cloud cover increase the probability
          mass assigned to a cloud burst event.
        </p>
        <p>
          The system exposes model diagnostics such as accuracy, F1-score, and feature importance so
          that practitioners can understand which variables are most influential in each prediction.
        </p>
      </section>

      <section className="mt-6 space-y-2 text-sm text-slate-700 dark:text-slate-300">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Team</h2>
        <p>
          This prototype is envisioned as an interdisciplinary effort between data scientists,
          meteorologists, and software engineers. The data science track focuses on model design,
          feature engineering, and validation, while the engineering track implements scalable APIs,
          responsive user interfaces, and integrations with external weather providers.
        </p>
      </section>

      <section className="mt-6 space-y-2 text-sm text-slate-700 dark:text-slate-300">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Technology stack</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Backend:</span> FastAPI, SQLite,
            SQLAlchemy, Pydantic, scikit-learn, joblib.
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Frontend:</span> React, Vite, React
            Router, Tailwind CSS, Recharts, React-Leaflet, React-Toastify, Lucide icons.
          </li>
          <li>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Integrations:</span> OpenWeatherMap API
            for live weather (with graceful degradation to mock data when no API key is present).
          </li>
        </ul>
      </section>

      <section className="mt-6 space-y-2 text-sm text-slate-700 dark:text-slate-300">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Reference (IEEE-style)</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          An example of a related citation in IEEE format:
        </p>
        <p className="text-xs text-slate-700 dark:text-slate-300">
          A. Sharma, R. Gupta and S. Rao, &quot;Machine Learning Based Cloud Burst Prediction Using
          Multi-Source Weather Data,&quot; in <i>Proceedings of the IEEE International Conference on
          Data Science and Advanced Analytics</i>, 2024.
        </p>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-500">
          Note: This project is a demonstration inspired by research in the field and is intended
          for educational and experimental use. It should not be used as the sole basis for
          life‑critical or safety‑critical decision making.
        </p>
      </section>
    </main>
  );
}

