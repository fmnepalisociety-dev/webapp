<script setup lang="ts">
import type { Member } from '~/types/member';
import {
  generateQrData,
  formatMemberName,
  formatExpiryDate,
  isExpired,
  getMemberId,
  getMembershipType
} from '~/composables/useMemberCards';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps<{
  member: Member
}>();

const qrData = computed(() => generateQrData(props.member));
const name = computed(() => formatMemberName(props.member));
const memberId = computed(() => getMemberId(props.member));
const memberEmail = computed(() => props.member.email);
const membershipType = computed(() => getMembershipType(props.member));
const expiryDisplay = computed(() => formatExpiryDate(props.member.expiry_date));
const expired = computed(() => isExpired(props.member.expiry_date));
</script>

<template>
  <div
    class="id-card"
    :class="{'id-card--expired': expired}"
  >
    <!-- Header -->
    <div class="id-card__header">
      <img
        src="/logo.png"
        alt="NSFM Logo"
        class="id-card__logo"
      />
      <div class="id-card__org">
        <div class="id-card__org-name">Nepali Society - Fargo Moorhead</div>
        <div class="id-card__org-name-np">नेपाली समाज - फार्गो मुरहेड</div>
      </div>
    </div>

    <!-- Body -->
    <div class="id-card__body">
      <!-- Top Row: Photo and QR Code -->
      <div class="id-card__top-row">
        <!-- Photo -->
        <div class="id-card__photo">
          <SupabaseImage
            v-if="member.image_path"
            bucket="members"
            :path="member.image_path"
            :alt="name"
            max-height="80px"
            classes="id-card__photo-img"
          />
          <div v-else class="id-card__photo-placeholder">
            <FontAwesomeIcon :icon="faUser" class="id-card__photo-icon" />
          </div>
        </div>

        <!-- QR Code -->
        <div class="id-card__qr">
          <QrCode :value="qrData" :size="80" level="M" />
        </div>
      </div>

      <!-- Info -->
      <div class="id-card__info">
        <div class="id-card__name">{{ name }}</div>
        <div class="id-card__detail">
          <span class="id-card__label">ID:</span>
          <span>{{ memberId }}</span>
        </div>
        <div class="id-card__detail">
          <span class="id-card__label">Email:</span>
          <span>{{ memberEmail }}</span>
        </div>
        <div class="id-card__detail">
          <span class="id-card__label">Type:</span>
          <span>{{ membershipType }}</span>
        </div>
        <div class="id-card__detail">
          <span class="id-card__label">Expires:</span>
          <span :class="{'text-red-600': expired}">{{ expiryDisplay }}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="id-card__footer">
      www.fmnepali.org
    </div>

    <!-- Expired Badge -->
    <div v-if="expired" class="id-card__expired-badge">EXPIRED</div>
  </div>
</template>

<style scoped>
.id-card {
  width: 212.5px;
  height: 337.5px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
  position: relative;
  font-family: system-ui, sans-serif;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.id-card--expired {
  border-color: #dc2626;
  opacity: 0.7;
}

.id-card__header {
  background: linear-gradient(135deg, #1c3382 0%, #a31432 100%);
  color: white;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.id-card__logo {
  width: 40px;
  height: 40px;
}

.id-card__org {
  text-align: center;
}

.id-card__org-name {
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
}

.id-card__org-name-np {
  font-size: 9px;
  opacity: 0.9;
}

.id-card__body {
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 12px;
  flex: 1;
}

.id-card__top-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: flex-start;
}

.id-card__photo {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.id-card__photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.id-card__photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.id-card__photo-icon {
  font-size: 32px;
  color: #9ca3af;
}

.id-card__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.id-card__name {
  font-size: 14px;
  font-weight: 700;
  color: #1c3382;
  margin-bottom: 4px;
  text-align: center;
}

.id-card__detail {
  font-size: 10px;
  color: #374151;
  line-height: 1.6;
  display: flex;
  flex-wrap: wrap;
}

.id-card__label {
  font-weight: 600;
  margin-right: 4px;
}

.id-card__qr {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.id-card__footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #f3f4f6;
  padding: 4px;
  text-align: center;
  font-size: 9px;
  color: #6b7280;
}

.id-card__expired-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  background: rgba(220, 38, 38, 0.9);
  color: white;
  padding: 4px 16px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 4px;
  letter-spacing: 2px;
}
</style>
