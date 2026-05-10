/**
 * HR ERP application Terraform module (Phase 3 scaffold).
 *
 * Provisions a Kubernetes namespace, a Helm release for the application
 * chart in deploy/helm/hr-erp, and the Postgres connection secret it needs.
 * Cloud-specific resources (managed Postgres, ALB, secrets manager) live in
 * sibling modules so this one stays portable across providers.
 */

terraform {
  required_version = ">= 1.6"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

variable "namespace" {
  description = "Kubernetes namespace to deploy HR ERP into."
  type        = string
  default     = "hr-erp"
}

variable "release_name" {
  description = "Helm release name."
  type        = string
  default     = "hr-erp"
}

variable "chart_path" {
  description = "Filesystem path to the HR ERP Helm chart."
  type        = string
  default     = "../../helm/hr-erp"
}

variable "image_tag" {
  description = "Container image tag (pin to an immutable digest in production)."
  type        = string
}

variable "database_url" {
  description = "Full Postgres connection string (placed in a Kubernetes secret)."
  type        = string
  sensitive   = true
}

variable "jwks_url" {
  description = "Public JWKS URL the API uses to verify access tokens."
  type        = string
}

variable "extra_values" {
  description = "Optional Helm values overrides as a single YAML string."
  type        = string
  default     = ""
}

resource "kubernetes_namespace" "hr_erp" {
  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/name"     = "hr-erp"
      "pod-security.kubernetes.io/enforce" = "restricted"
    }
  }
}

resource "kubernetes_secret" "database" {
  metadata {
    name      = "${var.release_name}-database"
    namespace = kubernetes_namespace.hr_erp.metadata[0].name
  }
  data = {
    DATABASE_URL = var.database_url
  }
  type = "Opaque"
}

resource "helm_release" "hr_erp" {
  name      = var.release_name
  namespace = kubernetes_namespace.hr_erp.metadata[0].name
  chart     = var.chart_path

  values = compact([
    yamlencode({
      image = {
        tag = var.image_tag
      }
      database = {
        existingSecret = kubernetes_secret.database.metadata[0].name
      }
      auth = {
        jwksUrl        = var.jwks_url
        existingSecret = kubernetes_secret.database.metadata[0].name
      }
    }),
    var.extra_values,
  ])
}

output "namespace" {
  value = kubernetes_namespace.hr_erp.metadata[0].name
}

output "release_name" {
  value = helm_release.hr_erp.name
}
