<?php

namespace Drupal\authoritymatch_core\Plugin\migrate\source;

use Drupal\migrate\Plugin\migrate\source\SourcePluginBase;

/**
 * Source plugin for factor JSON file.
 *
 * @MigrateSource(
 *   id = "factor_json_source",
 *   source_module = "authoritymatch_core"
 * )
 */
class FactorJsonSource extends SourcePluginBase {

  /**
   * {@inheritdoc}
   */
  public function __toString() {
    return 'Factor JSON Source';
  }

  /**
   * {@inheritdoc}
   */
  public function getIds() {
    return [
      'id' => [
        'type' => 'string',
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function fields() {
    return [
      'id' => 'Factor ID',
      'company_name' => 'Company Name',
      'legal_name' => 'Legal Name',
      'status' => 'Status',
      'verification_status' => 'Verification Status',
      'tax_id' => 'Tax ID',
      'contact_email' => 'Email',
      'contact_phone' => 'Phone',
      'contact_website' => 'Website',
      'address_street' => 'Street',
      'address_city' => 'City',
      'address_state' => 'State',
      'address_zip' => 'ZIP',
      'preferred_states' => 'Preferred States',
      'min_fleet_size' => 'Min Fleet Size',
      'max_fleet_size' => 'Max Fleet Size',
      'min_score' => 'Min Authority Score',
      'risk_tolerance' => 'Risk Tolerance',
      'advance_rates' => 'Advance Rates',
      'base_fee' => 'Base Fee',
      'total_clients' => 'Total Clients',
    ];
  }

  /**
   * {@inheritdoc}
   */
  protected function initializeIterator() {
    $file_path = $this->configuration['file_path'] ?? '/data/factors.json';
    
    if (!file_exists($file_path)) {
      throw new \RuntimeException("File not found: $file_path");
    }
    
    $data = json_decode(file_get_contents($file_path), TRUE);
    if (empty($data)) {
      return new \ArrayIterator([]);
    }
    
    $rows = [];
    foreach ($data as $record) {
      $rows[] = [
        'id' => $record['id'],
        'company_name' => $record['companyName'],
        'legal_name' => $record['legalName'],
        'status' => $record['status'],
        'verification_status' => $record['verificationStatus'],
        'tax_id' => $record['taxId'],
        'contact_email' => $record['contactInfo']['email'],
        'contact_phone' => $record['contactInfo']['phone'],
        'contact_website' => $record['contactInfo']['website'],
        'address_street' => $record['contactInfo']['address']['street'],
        'address_city' => $record['contactInfo']['address']['city'],
        'address_state' => $record['contactInfo']['address']['state'],
        'address_zip' => $record['contactInfo']['address']['zip'],
        'preferred_states' => $record['preferences']['preferredStates'],
        'min_fleet_size' => $record['preferences']['minFleetSize'],
        'max_fleet_size' => $record['preferences']['maxFleetSize'],
        'min_score' => $record['preferences']['minAuthorityScore'],
        'risk_tolerance' => $record['preferences']['riskTolerance'],
        'advance_rates' => $record['offerings']['advanceRates'],
        'base_fee' => $record['offerings']['baseFee'],
        'total_clients' => $record['metrics']['totalClients'],
      ];
    }
    
    return new \ArrayIterator($rows);
  }
}
