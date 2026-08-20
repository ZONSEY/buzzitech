import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { ContactComponent } from './pages/contact/contact.component';
import { BoutiqueComponent } from './pages/boutique/boutique.component';
import { OffresComponent } from './pages/offres/offres.component';
import { LoginComponent } from './pages/espace-client/login/login.component';
import { RegisterComponent } from './pages/espace-client/register/register.component';
import { MotDePasseOublieComponent } from './pages/espace-client/mot-de-passe-oublie/mot-de-passe-oublie.component';
import { ReinitialiserMotDePasseComponent } from './pages/espace-client/reinitialiser-mot-de-passe/reinitialiser-mot-de-passe.component';
import { VerifierEmailComponent } from './pages/espace-client/verifier-email/verifier-email.component';
import { AccountComponent } from './pages/espace-client/account/account.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { technicianGuard } from './core/guards/technician.guard';
import { RealisationsComponent } from './pages/realisations/realisations.component';
import { ProductDetailComponent } from './pages/boutique/product-detail/product-detail.component';
import { RealisationDetailComponent } from './pages/realisations/realisation-detail/realisation-detail.component';
import { AdminLayoutComponent } from './admin/layout/admin-layout.component';
import { AdminMessagesComponent } from './admin/messages/admin-messages.component';
import { AdminRealisationsComponent } from './admin/realisations/admin-realisations.component';
import { AdminProductsComponent } from './admin/products/admin-products.component';
import { AdminCategoriesComponent } from './admin/categories/admin-categories.component';
import { AdminOffresComponent } from './admin/offres/admin-offres.component';
import { AdminOrdersComponent } from './admin/orders/admin-orders.component';
import { AdminUsersComponent } from './admin/users/admin-users.component';
import { PanierComponent } from './pages/panier/panier.component';
import { AdressesComponent } from './pages/espace-client/adresses/adresses.component';
import { CommandesComponent } from './pages/espace-client/commandes/commandes.component';
import { CommandeDetailComponent } from './pages/espace-client/commande-detail/commande-detail.component';
import { ProjetsComponent } from './pages/espace-client/projets/projets.component';
import { NouveauProjetComponent } from './pages/espace-client/projets/nouveau/nouveau.component';
import { ProjetDetailComponent } from './pages/espace-client/projets/detail/detail.component';
import { ListeSouhaitsComponent } from './pages/espace-client/liste-souhaits/liste-souhaits.component';
import { MentionsLegalesComponent } from './pages/legal/mentions-legales/mentions-legales.component';
import { CgvComponent } from './pages/legal/cgv/cgv.component';
import { ConfidentialiteComponent } from './pages/legal/confidentialite/confidentialite.component';
import { TechnicienLayoutComponent } from './technicien/layout/technicien-layout.component';
import { TechnicienPlanningComponent } from './technicien/planning/technicien-planning.component';
import { TechnicienMissionDetailComponent } from './technicien/mission-detail/technicien-mission-detail.component';
import { TechnicienHistoriqueComponent } from './technicien/historique/technicien-historique.component';
import { AdminInterventionsComponent } from './admin/interventions/admin-interventions.component';
import { AdminMaterielComponent } from './admin/materiel/admin-materiel.component';
import { AdminPromoCodesComponent } from './admin/promo-codes/admin-promo-codes.component';
import { AdminEquipementsComponent } from './admin/equipements/admin-equipements.component';
import { MesInterventionsComponent } from './pages/espace-client/mes-interventions/mes-interventions.component';
import { InterventionDetailComponent } from './pages/espace-client/intervention-detail/intervention-detail.component';
import { EquipementsComponent } from './pages/espace-client/equipements/equipements.component';
import { AdminMaintenanceContractsComponent } from './admin/maintenance-contracts/admin-maintenance-contracts.component';
import { AdminProjetsComponent } from './admin/projets/admin-projets.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Buzzitech Assistance — Sécurité, réseaux & solutions intégrées',
    data: {
      description:
        "Buzzitech Assistance conçoit des solutions intégrées pour protéger vos personnes, vos biens, vos données et assurer la continuité de vos activités à Ouagadougou, Burkina Faso.",
    },
  },
  {
    path: 'realisations',
    component: RealisationsComponent,
    title: 'Nos réalisations — Buzzitech Assistance',
    data: {
      description:
        'Découvrez les projets de sécurité électronique, protection incendie et réseaux réalisés par Buzzitech Assistance.',
    },
  },
  {
    path: 'realisations/:slug',
    component: RealisationDetailComponent,
    title: 'Réalisation — Buzzitech Assistance',
  },
  {
    path: 'offres',
    component: OffresComponent,
    title: 'Nos offres de services — Buzzitech Assistance',
    data: {
      description:
        'Sécurité électronique, protection incendie, réseaux & cybersécurité : découvrez les services proposés par Buzzitech Assistance.',
    },
  },
  {
    path: 'boutique',
    component: BoutiqueComponent,
    title: 'Boutique — Buzzitech Assistance',
    data: {
      description:
        'Achetez du matériel de sécurité, vidéosurveillance et réseaux chez Buzzitech Assistance.',
    },
  },
  {
    path: 'boutique/:slug',
    component: ProductDetailComponent,
    title: 'Produit — Buzzitech Assistance',
  },
  {
    path: 'panier',
    component: PanierComponent,
    title: 'Mon panier — Buzzitech Assistance',
  },
  {
    path: 'espace-client',
    component: AccountComponent,
    canActivate: [authGuard],
    title: 'Mon compte — Buzzitech Assistance',
  },
  {
    path: 'espace-client/connexion',
    component: LoginComponent,
    title: 'Connexion — Buzzitech Assistance',
  },
  {
    path: 'espace-client/inscription',
    component: RegisterComponent,
    title: 'Créer un compte — Buzzitech Assistance',
  },
  {
    path: 'espace-client/mot-de-passe-oublie',
    component: MotDePasseOublieComponent,
    title: 'Mot de passe oublié — Buzzitech Assistance',
  },
  {
    path: 'espace-client/reinitialiser-mot-de-passe',
    component: ReinitialiserMotDePasseComponent,
    title: 'Réinitialiser le mot de passe — Buzzitech Assistance',
  },
  {
    path: 'espace-client/verifier-email',
    component: VerifierEmailComponent,
    title: 'Vérification email — Buzzitech Assistance',
  },
  {
    path: 'espace-client/adresses',
    component: AdressesComponent,
    canActivate: [authGuard],
    title: 'Mes adresses — Buzzitech Assistance',
  },
  {
    path: 'espace-client/liste-souhaits',
    component: ListeSouhaitsComponent,
    canActivate: [authGuard],
    title: 'Ma liste de souhaits — Buzzitech Assistance',
  },
  {
    path: 'espace-client/commandes',
    component: CommandesComponent,
    canActivate: [authGuard],
    title: 'Mes commandes — Buzzitech Assistance',
  },
  {
    path: 'espace-client/commandes/:id',
    component: CommandeDetailComponent,
    canActivate: [authGuard],
    title: 'Détail de la commande — Buzzitech Assistance',
  },
  {
    path: 'espace-client/projets',
    component: ProjetsComponent,
    canActivate: [authGuard],
    title: 'Mes demandes de projet — Buzzitech Assistance',
  },
  {
    path: 'espace-client/projets/nouveau',
    component: NouveauProjetComponent,
    canActivate: [authGuard],
    title: 'Nouvelle demande de projet — Buzzitech Assistance',
  },
  {
    path: 'espace-client/projets/:id',
    component: ProjetDetailComponent,
    canActivate: [authGuard],
    title: 'Demande de projet — Buzzitech Assistance',
  },
  {
    path: 'contact',
    component: ContactComponent,
    title: 'Contact — Buzzitech Assistance',
    data: {
      description:
        'Contactez Buzzitech Assistance pour un audit gratuit ou toute question sur nos produits et services de sécurité.',
    },
  },
  {
    path: 'mentions-legales',
    component: MentionsLegalesComponent,
    title: 'Mentions légales — Buzzitech Assistance',
  },
  {
    path: 'cgv',
    component: CgvComponent,
    title: 'Conditions générales de vente — Buzzitech Assistance',
  },
  {
    path: 'politique-de-confidentialite',
    component: ConfidentialiteComponent,
    title: 'Politique de confidentialité — Buzzitech Assistance',
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', component: DashboardComponent, title: 'Tableau de bord — Admin' },
      { path: 'commandes', component: AdminOrdersComponent, title: 'Commandes — Admin' },
      { path: 'utilisateurs', component: AdminUsersComponent, title: 'Utilisateurs — Admin' },
      { path: 'messages', component: AdminMessagesComponent, title: 'Messages — Admin' },
      { path: 'realisations', component: AdminRealisationsComponent, title: 'Réalisations — Admin' },
      { path: 'produits', component: AdminProductsComponent, title: 'Produits — Admin' },
      {
        path: 'categories',
        component: AdminCategoriesComponent,
        title: 'Catégories & marques — Admin',
      },
      { path: 'offres', component: AdminOffresComponent, title: 'Offres — Admin' },
      { path: 'interventions', component: AdminInterventionsComponent, title: 'Interventions — Admin' },
      { path: 'materiel', component: AdminMaterielComponent, title: 'Catalogue matériel — Admin' },
      { path: 'codes-promo', component: AdminPromoCodesComponent, title: 'Codes promo — Admin' },
      { path: 'equipements', component: AdminEquipementsComponent, title: 'Équipements — Admin' },
      {
        path: 'contrats-maintenance',
        component: AdminMaintenanceContractsComponent,
        title: 'Contrats de maintenance — Admin',
      },
      { path: 'projets', component: AdminProjetsComponent, title: 'Demandes de projet — Admin' },
    ],
  },
  {
    path: 'technicien',
    component: TechnicienLayoutComponent,
    canActivate: [technicianGuard],
    children: [
      { path: '', component: TechnicienPlanningComponent, title: 'Mon planning — Technicien' },
      { path: 'historique', component: TechnicienHistoriqueComponent, title: 'Historique — Technicien' },
      { path: 'missions/:id', component: TechnicienMissionDetailComponent, title: 'Mission — Technicien' },
    ],
  },
  {
    path: 'espace-client/interventions',
    component: MesInterventionsComponent,
    canActivate: [authGuard],
    title: 'Mes interventions — Buzzitech Assistance',
  },
  {
    path: 'espace-client/interventions/:id',
    component: InterventionDetailComponent,
    canActivate: [authGuard],
    title: 'Suivi d\'intervention — Buzzitech Assistance',
  },
  {
    path: 'espace-client/equipements',
    component: EquipementsComponent,
    canActivate: [authGuard],
    title: 'Mes équipements — Buzzitech Assistance',
  },
  {
    // Ancienne route conservée en redirection, pour ne pas casser
    // d'éventuels liens déjà partagés.
    path: 'dashboard',
    redirectTo: 'admin',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
