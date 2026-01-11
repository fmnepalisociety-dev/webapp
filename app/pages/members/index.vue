<template>
  <main style="padding: 20px">
    <h1>Members</h1>

    <table border="1" cellpadding="8">
      <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Address</th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="m in members" :key="m.id">
        <td>{{ m.firstname }} {{ m.lastname }}</td>
        <td>{{ m.email }}</td>
        <td>{{ m.phone || '-' }}</td>
        <td>{{ m.address || '-' }}</td>
      </tr>
      </tbody>
    </table>
  </main>
</template>

<script setup>
import {getMembers} from "../../composables/useMembers.ts";

const members = await getMembers();
</script>
