const StripePayment = {
  // შენი Render backend-ის მისამართი
  SERVER_URL: 'https://ethical-hacking-academy-1.onrender.com',

  async startPayment(courseData) {
    try {
      const response = await fetch(`${this.SERVER_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: courseData.id,
          courseTitle: courseData.title,
          amount: courseData.price,
          userId: courseData.userId || 'guest',
          userEmail: courseData.userEmail || '',
        }),
      });

      const data = await response.json();

      if (data.ok && data.url) {
        // გადამისამართება Stripe-ის Checkout გვერდზე
        window.location.href = data.url;
      } else {
        alert('შეცდომა: ' + (data.error || 'გადახდის ინიციალიზაცია ვერ მოხერხდა'));
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('სერვერთან კავშირის შეცდომა');
    }
  }
};
