{{/* vim: set filetype=mustache: */}}
{{- define "hr-erp.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "hr-erp.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "hr-erp.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "hr-erp.labels" -}}
app.kubernetes.io/name: {{ include "hr-erp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "hr-erp.selectorLabels" -}}
app.kubernetes.io/name: {{ include "hr-erp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
