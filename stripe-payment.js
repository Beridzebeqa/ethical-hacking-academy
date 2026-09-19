const StripePayment = {
  SERVER_URL: 'https://ethical-hacking-academy-1.onrender.com',

  async startPayment(data) {
    try {
      const response = await fetch(`${this.SERVER_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Backend ელოდება ზუსტად ამ დასახელების ველებს:
          courseId: data.courseId || data.id,
          courseTitle: data.courseTitle || data.title,
          amount: data.amount || data.price,
          userId: data.userId || 'guest',
          userEmail: data.userEmail || '',
        }),
      });

      const result = await response.json();

      if (result.ok && result.url) {
        window.location.href = result.url;
      } else {
        alert('შეცდომა: ' + (result.error || 'გადახდის ინიციალიზაცია ვერ მოხერხდა'));
      }
    } catch (err) {
      console.error('Payment Error:', err);
      alert('სერვერთან კავშირის შეცდომა');
    }
  }
};
