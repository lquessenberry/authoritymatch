<?php

namespace Drupal\authoritymatch_core\Plugin\migrate\source;

use Drupal\migrate\Plugin\migrate\source\SourcePluginBase;
use Drupal\migrate\Row;

/**
 * Source plugin for authority JSON batch files.
 *
 * @MigrateSource(
 *   id = "authority_json_source",
 *   source_module = "authoritymatch_core"
 * )
 */
class AuthorityJsonSource extends SourcePluginBase {

  /**
   * {@inheritdoc}
   */
  public function __toString() {
    return 'Authority JSON Batch Source';
  }

  /**
   * {@inheritdoc}
   */
  public function getIds() {
    return [
      'dot_number' => [
        'type' => 'string',
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function fields() {
    return [
      'dot_number' => 'DOT Number',
      'legal_name' => 'Legal Name',
      'dba_name' => 'DBA Name',
      'state' => 'State',
      'status' => 'Status',
      'carrier_operation' => 'Carrier Operation',
      'street' => 'Street Address',
      'city' => 'City',
      'zip' => 'ZIP Code',
      'phone' => 'Phone',
      'email' => 'Email',
      'total_drivers' => 'Total Drivers',
      'total_power_units' => 'Total Power Units',
      'safety_rating' => 'Safety Rating',
      'add_date' => 'Authority Date',
      'mcs150_date' => 'MCS150 Date',
    ];
  }

  /**
   * {@inheritdoc}
   */
  protected function initializeIterator() {
    $file_path = $this->configuration['file_path'] ?? '/data/batch_00001.json';
    
    if (!file_exists($file_path)) {
      throw new \RuntimeException("File not found: $file_path");
    }
    
    $data = json_decode(file_get_contents($file_path), TRUE);
    if (empty($data)) {
      return new \ArrayIterator([]);
    }
    
    // Transform data for migration
    $rows = [];
    foreach ($data as $record) {
      $rows[] = [
        'dot_number' => $record['dotNumber'] ?? '',
        'legal_name' => $record['legalName'] ?? '',
        'dba_name' => $record['dbaName'] ?? '',
        'state' => $record['state'] ?? '',
        'status' => $record['status'] ?? 'I',
        'carrier_operation' => $record['carrierOperation'] ?? '',
        'street' => $record['physicalAddress']['street'] ?? '',
        'city' => $record['physicalAddress']['city'] ?? '',
        'zip' => $record['physicalAddress']['zip'] ?? '',
        'phone' => $record['phone'] ?? '',
        'email' => $record['email'] ?? '',
        'total_drivers' => (int) ($record['totalDrivers'] ?? 0),
        'total_power_units' => (int) ($record['totalPowerUnits'] ?? 0),
        'safety_rating' => $record['safetyRating'] ?? '',
        'add_date' => $this->formatDate($record['addDate'] ?? ''),
        'mcs150_date' => $this->formatDate($record['mcs150Date'] ?? ''),
      ];
    }
    
    return new \ArrayIterator($rows);
  }

  /**
   * Format date from FMCSA format (YYYYMMDD) to ISO.
   */
  private function formatDate($date_string) {
    if (empty($date_string) || strlen($date_string) !== 8) {
      return NULL;
    }
    $year = substr($date_string, 0, 4);
    $month = substr($date_string, 4, 2);
    $day = substr($date_string, 6, 2);
    return "$year-$month-$day";
  }
}
