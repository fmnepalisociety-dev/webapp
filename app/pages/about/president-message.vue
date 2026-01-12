<template>
  <div class="president-message">
    <div class="header">
      <h2>Message from the President</h2>
    </div>
    <div class="body">
      <p>Namaste and warm greetings!</p>

      <p>
        It is my great honor to introduce our newly established Nepalese Society in Fargo, North Dakota
        (formal designation: Nepalese Society in Fargo-Moorhead). We envision bringing individuals
        together who celebrate Nepali culture, traditions, and language along with the US culture and
        tradition. We encourage active participation in social, cultural, and community initiatives,
        and contributing positively to our community and beyond. I encourage every member to get
        involved, share ideas, and contribute their talents. Together, we can create a vibrant and
        supportive community that honors our shared vision and makes a meaningful impact in our
        community.
      </p>

      <p>
        Through cultural events, volunteer activities, and networking opportunities, we hope to create
        a space where everyone feels valued and empowered. With active involvement in local events,
        educational programs, and intercultural projects, we can both strengthen our community and
        contribute positively to the wider society. Building relationships with our neighbors, sharing
        our culture, and collaborating on social initiatives will help us create mutual understanding,
        respect, and lasting impact.
      </p>

      <p>Thank you for joining us on this journey. I look forward to working with all of you to achieve our common
        goals.</p>

      <p class="signature">Sincerely,<br>Shyam Kandel</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
// Currently static content, can later be replaced with dynamic content from database
</script>

<style scoped>
.president-message {
  max-width: 700px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #f9f9f9;
  border-left: 6px solid #2c3e50;
  border-radius: 8px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

.header h2 {
  margin-bottom: 1rem;
  font-size: 1.8rem;
  color: #2c3e50;
  border-bottom: 2px solid #2c3e50;
  display: inline-block;
  padding-bottom: 0.25rem;
}

.body p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.signature {
  margin-top: 2rem;
  font-weight: bold;
}
</style>
