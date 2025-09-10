<template>
  <div>
    <!-- Header con información compacta -->
    <MDBListGroup class="employerList">
      <MDBListGroupItem
        @click="selectOtherEmployer"
        class="employer header-item"
      >
        <div class="header-content">
          <MDBIcon icon="user-tag" class="header-icon" />
          <span class="header-text">{{ SelectEmployer.nombre }}</span>
        </div>
      </MDBListGroupItem>
      <MDBListGroupItem @click="selectOtherTable" class="employer header-item">
        <div class="header-content">
          <MDBIcon icon="shopping-basket" class="header-icon" />
          <span class="header-text"
            >{{
              selectTable.nombre
                ? selectTable.nombre
                : "Mesa " + (selectTable.indexMesa + 1)
            }}
            |

            {{ selectTable.comensales }} comensales</span
          >
        </div>
      </MDBListGroupItem>
      <MDBListGroupItem
        class="employer header-item ticket-summary"
        @click="router.push('/ticketview')"
      >
        <div class="ticketBtn">
          <div class="ticket-amount">
            <MDBIcon icon="hand-holding-usd" class="header-icon" />
            <span class="amount-text">
              {{
                (
                  selectTable.detalleIva.importe1 +
                  selectTable.detalleIva.importe2 +
                  selectTable.detalleIva.importe3 +
                  selectTable.detalleIva.importe4 +
                  selectTable.detalleIva.importe5
                ).toFixed(2)
              }}€
            </span>
          </div>
          <span class="ticket-label">Ver ticket</span>
        </div>
      </MDBListGroupItem>
    </MDBListGroup>

    <div class="section-divider"></div>

    <!-- Lista de categorías mejorada -->
    <div class="categories-section">
      <div class="section-title">
        <MDBIcon icon="th-large" />
        <span>Categorías</span>
      </div>

      <MDBListGroup class="tableList">
        <MDBListGroupItem
          v-for="(x, i) in categories"
          :key="i"
          class="category-item"
          @click="selectCategory(i, null)"
          :class="{ 'category-expanded': subMenus && selectedSubcategory == i }"
        >
          <div class="category-content">
            <div class="category-main">
              <MDBIcon icon="folder" class="category-icon" />
              <span class="category-name">{{ x.nombre }}</span>
            </div>
            <div class="category-info">
              <span class="product-count" v-if="!subMenus">
                {{ x.arrayTeclas?.length || 0 }}
              </span>
              <MDBIcon
                v-if="subMenus"
                :icon="selectedSubcategory == i ? 'chevron-up' : 'chevron-down'"
                class="expand-icon"
              />
            </div>
          </div>

          <!-- Subcategorías -->
          <div
            v-if="subMenus && selectedSubcategory == i"
            class="subcategories"
          >
            <MDBListGroupItem
              v-for="(z, n) in x.arraySubmenus"
              :key="n"
              class="subcategory-item"
              @click.stop="selectCategory(i, n)"
            >
              <div class="subcategory-content">
                <MDBIcon icon="folder-open" class="subcategory-icon" />
                <span class="subcategory-name">{{ z.nombre }}</span>
                <span class="subcategory-count">{{
                  z.arrayTeclas?.length || 0
                }}</span>
              </div>
            </MDBListGroupItem>
          </div>
        </MDBListGroupItem>
      </MDBListGroup>
    </div>
  </div>
</template>

<script>
import {
  MDBFooter,
  MDBIcon,
  MDBListGroup,
  MDBListGroupItem,
} from "mdb-vue-ui-kit";

import { useStore } from "vuex";
import { ref, computed, onMounted } from "vue";
import { io } from "socket.io-client";
import { useRouter } from "vue-router";
import router from "@/router";

export default {
  name: "MenuPrincipalView",
  components: {
    MDBFooter,
    MDBIcon,
    MDBListGroup,
    MDBListGroupItem,
  },
  setup() {
    const store = useStore();
    const route = useRouter();
    const totalTable = ref(0);
    const SelectEmployer = computed(
      () => store.state.Employers.selectedEmployer
    );
    const selectTable = computed(() => store.state.Tables.selectedTable);
    const categories = computed(() => store.state.Categories.arrayCategories);
    const subMenus = ref(null);
    const actualPage = computed(() => route.currentRoute.value.path);
    const selectedSubcategory = ref(-1);

    const selectOtherEmployer = () => {
      router.push("/employer");
    };
    const selectOtherTable = () => {
      router.push("/tableselection");
    };

    const selectCategory = (i, x) => {
      if (subMenus.value && x == null) return (selectedSubcategory.value = i);
      let cat = subMenus.value
        ? categories.value[i].arraySubmenus[x]
        : categories.value[i];

      store.dispatch("Categories/setSelectedCategoryMutation", cat);
      router.push("/productselection");
    };

    onMounted(() => {
      if (!SelectEmployer.value) router.push("/");

      if (subMenus.value == null)
        subMenus.value = categories.value[0]?.arrayTeclas?.length == undefined;
    });

    return {
      actualPage,
      selectOtherEmployer,
      selectedSubcategory,
      router,
      selectOtherTable,
      selectTable,
      selectCategory,
      subMenus,
      SelectEmployer,
      totalTable,

      categories,
    };
  },
};
</script>

<style lang="scss" scoped>
.employerList {
  width: 100%;
  margin-top: 2%;
}

.header-item {
  background-color: #ffffff69;
  padding: 4%;
  margin-bottom: 2px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #ffffff80;
    transform: translateY(-1px);
  }
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 1.2rem;
  color: #666;
  min-width: 20px;
}

.header-text {
  font-size: 1rem;
  font-weight: 500;
}

.ticket-summary {
  background-color: #f8f9fa !important;
  border: 2px solid #e9ecef;
}

.ticketBtn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.ticket-amount {
  display: flex;
  align-items: center;
  gap: 8px;
}

.amount-text {
  font-size: 1.3rem;
  font-weight: bold;
  color: #28a745;
}

.ticket-label {
  font-size: 0.9rem;
  font-style: italic;
  color: #666;
}

.section-divider {
  height: 3px;
  background: linear-gradient(90deg, #e9ecef 0%, #dee2e6 50%, #e9ecef 100%);
  margin: 20px 0;
  border-radius: 2px;
}

.categories-section {
  margin-top: 3%;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
  font-weight: 600;
  color: #495057;
  border-left: 4px solid #007bff;
}

.tableList {
  width: 100%;
}

.category-item {
  background-color: #ffffff69;
  margin-bottom: 8px;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid transparent;

  &:hover {
    background-color: #ffffff80;
    border-color: #dee2e6;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.category-expanded {
    background-color: #ffffff90;
    border-color: #007bff;
  }
}

.category-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
}

.category-main {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.category-icon {
  font-size: 1.3rem;
  color: #007bff;
  min-width: 24px;
}

.category-name {
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-count {
  background-color: #007bff;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  min-width: 30px;
  text-align: center;
}

.expand-icon {
  font-size: 1rem;
  color: #666;
  transition: transform 0.3s ease;
}

.subcategories {
  background-color: rgba(255, 255, 255, 0.3);
  border-top: 1px solid #e9ecef;
}

.subcategory-item {
  background-color: transparent;
  border: none;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }
}

.subcategory-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 12px 50px;
}

.subcategory-icon {
  font-size: 1rem;
  color: #6c757d;
  margin-right: 12px;
}

.subcategory-name {
  flex: 1;
  font-size: 0.95rem;
  color: #495057;
}

.subcategory-count {
  background-color: #6c757d;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  min-width: 24px;
  text-align: center;
}
</style>
