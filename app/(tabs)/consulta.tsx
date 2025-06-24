import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function Consulta() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [registros, setRegistros] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [alunosDoRegistro, setAlunosDoRegistro] = useState<any[]>([]);
  const [chaveSelecionada, setChaveSelecionada] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const flatListRef = useRef<FlatList>(null);

  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');

  useEffect(() => {
    carregarRegistros();
  }, [selectedDate]);

  const carregarRegistros = async () => {
    try {
      const todasChaves = await AsyncStorage.getAllKeys();
      const chavePrefixo = `registro_${formatDate(selectedDate)}`;
      const chavesDoDia = todasChaves.filter((chave) => chave.startsWith(chavePrefixo));
      const dados = await AsyncStorage.multiGet(chavesDoDia);
      const registrosFormatados = dados.map(([_, valor]) => JSON.parse(valor ?? '{}'));
      setRegistros(registrosFormatados);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Erro ao carregar registros.',
      });
    }
  };

  const limparRegistrosDoDia = async () => {
    try {
      const todasChaves = await AsyncStorage.getAllKeys();
      const chavePrefixo = `registro_${formatDate(selectedDate)}`;
      const chavesDoDia = todasChaves.filter((chave) => chave.startsWith(chavePrefixo));

      if (chavesDoDia.length > 0) {
        await AsyncStorage.multiRemove(chavesDoDia);
        setRegistros([]);
        Toast.show({
          type: 'success',
          text1: 'Registros removidos com sucesso!',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Erro ao limpar registros.',
      });
    }
  };

  const abrirModalComAlunos = async (index: number) => {
    try {
      const todasChaves = await AsyncStorage.getAllKeys();
      const chavePrefixo = `registro_${formatDate(selectedDate)}`;
      const chavesDoDia = todasChaves.filter((chave) => chave.startsWith(chavePrefixo));
      const chave = chavesDoDia[index];

      if (chave) {
        const valor = await AsyncStorage.getItem(chave);
        if (valor) {
          const registro = JSON.parse(valor);
          setAlunosDoRegistro(registro.students || []);
          setChaveSelecionada(chave);
          setModalVisible(true);
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Erro ao abrir os dados.',
      });
    }
  };

  const salvarAlteracoes = async () => {
    setIsLoading(true);
    try {
      if (chaveSelecionada) {
        const registroOriginal = await AsyncStorage.getItem(chaveSelecionada);
        if (registroOriginal) {
          const registro = JSON.parse(registroOriginal);
          registro.students = alunosDoRegistro;

          // RECALCULAR totalPresentes e totalFaltas
          let newTotalPresentes = 0;
          let newTotalFaltas = 0;

          registro.students.forEach((aluno: { presence: string; }) => { 
            if (aluno.presence === 'P') {
              newTotalPresentes++;
            } else if (aluno.presence === 'F' || aluno.presence === 'FJ') { // Considere FJ como falta para o total
              newTotalFaltas++;
            }
          });

          registro.totalPresentes = newTotalPresentes;
          registro.totalFaltas = newTotalFaltas;
          // FIM DO RECALCULO

          await AsyncStorage.setItem(chaveSelecionada, JSON.stringify(registro));

          // ... (seu código para enviar para o Google Sheets, se aplicável)
          await Promise.all(
            alunosDoRegistro.map((aluno) =>
              fetch(
                'https://script.google.com/macros/s/AKfycbyfTJUtqo0FTOLFSfIqddx1VR0F-lsyElN84I0GoY3rxMM6AOUAMS0pMgLcb3rwTuynfA/exec',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chaveRegistro: chaveSelecionada,
                    studentName: aluno.name,
                    newPresence: aluno.presence,
                  }),
                }
              )
            )
          );


          Toast.show({
            type: 'success',
            text1: 'Frequência atualizada!',
          });

          setModalVisible(false);
          carregarRegistros(); // Recarrega os registros, que agora terão os totais atualizados
        }
      }
    } catch (error) {
      console.error("Erro ao salvar alterações:", error); // Adicione um console.error para depuração
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Erro ao salvar as alterações.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Frequências Registradas</Text>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#eef5ff', padding: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Editar Presença</Text>

          <ScrollView>
            {alunosDoRegistro.map((aluno, index) => (
              <View key={index} style={{ marginBottom: 16 }}>
                <Text style={{ marginBottom: 4, fontWeight: 'bold' }}>{aluno.name}</Text>
                <View
                  style={{
                    backgroundColor:
                      aluno.presence === 'P'
                        ? '#a7f3d0'
                        : aluno.presence === 'F'
                        ? '#fecaca'
                        : '#fef9c3',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#ccc',
                  }}
                >
                  <Picker
                    selectedValue={aluno.presence}
                    onValueChange={(valor) => {
                      const novosAlunos = [...alunosDoRegistro];
                      novosAlunos[index].presence = valor;
                      setAlunosDoRegistro(novosAlunos);
                    }}
                  >
                    <Picker.Item label="P - Presente" value="P" />
                    <Picker.Item label="F - Falta" value="F" />
                    <Picker.Item label="FJ - Falta Justificada" value="FJ" />
                  </Picker>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={salvarAlteracoes}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Salvar Alterações</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={{ color: '#003B73', textAlign: 'center' }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.content}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>Data: {formatDate(selectedDate)}</Text>
          </TouchableOpacity>
          <Text style={styles.dateText}>Registros: {registros.length}</Text>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}

        <FlatList
          ref={flatListRef}
          data={registros}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => abrirModalComAlunos(index)}>
              <View style={styles.item}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemText}>Ano: {item.ano}</Text>
                  <Text style={styles.itemText}>Turma: {item.turma}</Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemText}>Presença: {item.totalPresentes}</Text>
                  <Text style={styles.itemText}>Falta: {item.totalFaltas}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              Nenhum registro encontrado para esta data.
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>

      <TouchableOpacity style={styles.clearButton} onPress={limparRegistrosDoDia}>
        <Text style={styles.clearButtonText}>Limpar registros do dia</Text>
      </TouchableOpacity>

      <Toast />

      {isLoading && (
      <Modal transparent={true} animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#003B73" />
            <Text style={styles.loadingText}>Processando...</Text>
          </View>
        </View>
        
      </Modal>
)}

    </View>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#eef5ff',
    padding: 16,
    paddingBottom: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#003B73',
  },
  dateText: {
    fontSize: 16,
    color: '#003B73',
    textAlign: 'center',
    marginBottom: 10,
  },
  item: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    color: '#003B73',
  },
  itemLeft: {
    flexDirection: 'column',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  clearButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FF5C5C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#003B73',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  cancelButton: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#003B73',
  },
  loadingOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
loadingContainer: {
  backgroundColor: '#fff',
  padding: 20,
  borderRadius: 10,
  alignItems: 'center',
},
loadingText: {
  marginTop: 10,
  color: '#003B73',
  fontWeight: 'bold',
  fontSize: 16,
},
});
