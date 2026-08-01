import "vue-router";

export {};

declare module "vue-router" {
    interface RouteMeta {
        requireAuth?: boolean;
        onlyGuest?: boolean;
        requireProfile?: boolean;
    }
}
