import Navigation from '../components/Navigation.jsx'
import PaymentMethods from '../components/PaymentMethods.jsx'

function PaymentMethodsPage() {
  return (
    <main className="dashboard-page">
      <Navigation />
      <section className="dashboard-content payment-methods-content">
        <PaymentMethods />
      </section>
    </main>
  )
}

export default PaymentMethodsPage