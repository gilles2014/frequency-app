import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Toast from 'react-native-toast-message';


/* ───────── Types ───────── */
type Presenca = 'P' | 'F' | 'FJ';

interface Student {
  id: string;
  name: string;
  presence: Presenca;
}


export default function Frequencia() {
  /* state */
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [anoSelecionado, setAnoSelecionado] = useState<string | null>(null);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [openAno, setOpenAno] = useState(false);
  const [openTurma, setOpenTurma] = useState(false);

  const presenceOptions: Presenca[] = ['P', 'F', 'FJ'];
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  
  const [turmas, setTurmas] = useState<Record<string, Record<string, string[]>> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  
const carregarTurmas = async (forcarAtualizacao = false) => {
  try {
    if (!forcarAtualizacao) {
      const cache = await AsyncStorage.getItem('turmas_cache');
      if (cache) {
        setTurmas(JSON.parse(cache));
        return;
      }
    }

    const res = await fetch('https://script.google.com/macros/s/AKfycbzSrdV8olN0RuoVMXWTn5_qaSZVfiqg_MAHEJxkmHFwTrhvpj3a9PRGlAt7d7tu4v1xYg/exec');
    const json = await res.json();
    setTurmas(json);
    await AsyncStorage.setItem('turmas_cache', JSON.stringify(json));
  } catch (err) {
    console.error('Não foi possível carregar turmas:', err);
  }
};


    useEffect(() => {
      carregarTurmas();
    }, []);


  /*Consultas basicas exemplo*/
  const [anoItems, setAnoItems] = useState<{ label: string; value: string }[]>([]);
  const [turmaItems, setTurmaItems] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    if (!turmas) return;
    //console.log("TURMAS CARREGADAS:", turmas);
    
    const anos = Object.keys(turmas)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((ano) => ({ label: ano, value: ano }));
    setAnoItems(anos);
  }, [turmas]);

  useEffect(() => {
    if (!turmas || !anoSelecionado) return;

    const turmasDoAno = Object.keys(turmas[anoSelecionado])
      .sort() // ordena corretamente (A, B, C, ..., J)
      .map((turma) => ({
        label: turma,
        value: turma,
      }));

    //console.log('TURMAS DO ANO', turmasDoAno); // 🧪 debug
    setTurmaItems(turmasDoAno);
  }, [turmas, anoSelecionado]);




    /* update list */
  useEffect(() => {
    // se ainda não carregou as turmas, ou não selecionou ano/turma, limpa a lista
    if (!turmas || !anoSelecionado || !turmaSelecionada) {
      setStudents([]);
      return;
    }

    // pega o array de nomes vindo do Google Sheets
    const nomesDaPlanilha =
      turmas[anoSelecionado]?.[turmaSelecionada] ?? [];

    // mapeia para o formato Student
    const lista: Student[] = nomesDaPlanilha.map((n, i) => ({
      id: `${anoSelecionado}-${turmaSelecionada}-${i}`,
      name: n,
      presence: 'P',
    }));

    setStudents(lista);
  }, [turmas, anoSelecionado, turmaSelecionada]);


  /* helpers */
  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');

  const chaveRegistro = `registro_${formatDate(selectedDate)}_${anoSelecionado}_${turmaSelecionada}`;

// --- FUNÇÃO PARA REGISTRAR NOVA FREQUÊNCIA ---
const handleRegistrar = async () => {
  if (!anoSelecionado || !turmaSelecionada) {
    Toast.show({
      type: 'info',
      text1: 'Atenção',
      text2: 'Selecione o ano e a turma antes de registrar.',
      position: 'top',
    });
    return;
  }

  try {
    const registroExistente = await AsyncStorage.getItem(chaveRegistro);
    if (registroExistente) {
      Toast.show({
        type: 'info',
        text1: 'Registro Existente',
        text2: `Esta turma já foi registrada na data ${formatDate(selectedDate)}.`,
        position: 'top',
      });
      return;
    }
  } catch (err) {
    console.error('Erro ao verificar registro anterior:', err);
    Toast.show({
      type: 'error',
      text1: 'Erro',
      text2: 'Erro ao verificar registro anterior.',
      position: 'top',
    });
    return;
  }

  setIsSaving(true); // Inicia o indicador de carregamento/salvamento

  const totalPresentes = students.filter((aluno) => aluno.presence === 'P').length;
  const totalFaltas = students.length - totalPresentes;

  // Payload para enviar para o Google Apps Script (SEM 'action')
  const payloadParaAPI = {
    chaveRegistro: chaveRegistro,
    date: formatDate(selectedDate),
    ano: anoSelecionado,
    turma: turmaSelecionada,
    students: students.map((s) => ({
      name: s.name,
      presence: s.presence
    })),
  };

  try {
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbyfTJUtqo0FTOLFSfIqddx1VR0F-lsyElN84I0GoY3rxMM6AOUAMS0pMgLcb3rwTuynfA/exec',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadParaAPI), // Envia o payload SEM 'action' para a API
      }
    );

    const text = await response.text();
    if (text.startsWith('OK')) { // Usa startsWith para lidar com "OK - Dados salvos."
      // Salva marcação no AsyncStorage para controle local (também sem 'action')
      await AsyncStorage.setItem(
        chaveRegistro,
        JSON.stringify({
          ...payloadParaAPI, // Inclui todos os dados do payload enviado para a API
          registrado: true,
          totalPresentes: totalPresentes,
          totalFaltas: totalFaltas,
        })
      );

      Toast.show({
        type: 'success',
        text1: 'Frequência registrada!',
        text2: `Total de ausências: ${totalFaltas}`,
        position: 'top',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Erro ao salvar',
        text2: text,
        position: 'top',
      });
    }
  } catch (err) {
    Toast.show({
      type: 'error',
      text1: 'Erro de Conexão',
      text2: 'Erro ao registrar presença.',
      position: 'top',
    });
    console.error(err);
  } finally {
    setIsSaving(false); // Finaliza o indicador de carregamento/salvamento
  }
};

// --- NOVA FUNÇÃO PARA EDITAR A PRESENÇA ---
const handleEditPresence = async (chaveRegistro: String, studentName: String, newPresence: String) => {
  if (!chaveRegistro || !studentName || !newPresence) {
    Toast.show({
      type: 'error',
      text1: 'Erro',
      text2: 'Todos os campos são necessários para editar a presença.',
      position: 'top',
    });
    return;
  }

  setIsSaving(true); // Ativa um indicador de loading para esta operação de edição

  // Payload para edição (SEM 'action', o Apps Script inferirá pela presença de studentName e newPresence)
  const payloadParaEdicao = {
    chaveRegistro: chaveRegistro,
    studentName: studentName,
    newPresence: newPresence,
  };

  try {
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbyfTJUtqo0FTOLFSfIqddx1VR0F-lsyElN84I0GoY3rxMM6AOUAMS0pMgLcb3rwTuynfA/exec', 
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadParaEdicao), // Envia o payload SEM 'action' para a API
      }
    );

    const text = await response.text();
    if (text.startsWith('OK')) {
      Toast.show({
        type: 'success',
        text1: 'Presença atualizada!',
        text2: text,
        position: 'top',
      });
      // Adicione aqui a lógica para atualizar o estado local dos seus alunos,
      // para que a UI reflita a mudança de presença imediatamente.
      // Ex: se você tem um estado 'students', você pode mapear e atualizar o aluno específico.
    } else {
      Toast.show({
        type: 'error',
        text1: 'Erro ao atualizar',
        text2: text,
        position: 'top',
      });
    }
  } catch (err) {
    Toast.show({
      type: 'error',
      text1: 'Erro de Conexão',
      text2: 'Erro ao editar presença.',
      position: 'top',
    });
    console.error(err);
  } finally {
    setIsSaving(false); // Finaliza o indicador de loading
  }
};


const flatListRef = useRef<FlatList>(null);


  if (!turmas) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Carregando turmas...</Text>
      </View>
    );
  }


  /* render */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro de Presença</Text>

      {/* data */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>Data: {formatDate(selectedDate)}</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>Alunos: {students.length}</Text>
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

      {/* ano / turma */}
      <View style={styles.anoTurmaRow}>
        <View style={{ flex: 1 }}>
          <DropDownPicker
            open={openAno}
            value={anoSelecionado}
            items={anoItems}
            setOpen={setOpenAno}
            setValue={setAnoSelecionado}
            setItems={setAnoItems}
            placeholder="Ano"
            zIndex={3000}
            zIndexInverse={1000}
          />
        </View>
        <View style={{ flex: 1 }}>
          <DropDownPicker
            listMode="SCROLLVIEW"
            open={openTurma}
            value={turmaSelecionada}
            items={turmaItems}
            setOpen={setOpenTurma}
            setValue={setTurmaSelecionada}
            setItems={setTurmaItems}
            placeholder="Turma"
            zIndex={5000}
            zIndexInverse={1000}
            style={{ minHeight: 50 }}
            dropDownContainerStyle={{
              maxHeight: 400, // ajuste conforme necessário
            }}
            
          />
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 200 }} // Espaço extra para o último dropdown
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => {
          const items = presenceOptions.map((p) => ({ label: p, value: p }));
          const isOpen = openIndex === item.id;
          const lineZ = students.length - index;

          return (
            <View
              style={[
                styles.studentRow,
                {
                  zIndex: lineZ,
                  elevation: lineZ, // para Android
                  position: 'relative',
                },
              ]}
            >
              <Text style={styles.studentName}>{item.name}</Text>

              <View style={styles.dropdownWrapper}>
                <DropDownPicker
                  open={isOpen}
                  value={item.presence}
                  items={items}
                  setOpen={() => {
                    if (openIndex !== item.id) {
                      setOpenIndex(item.id);

                      setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index, animated: true });
                      }, 200);
                    } else {
                      setOpenIndex(null);
                    }
                  }}

                  setValue={(cb) => {
                    const newVal = cb(item.presence);
                    setStudents((prev) =>
                      prev.map((st) =>
                        st.id === item.id ? { ...st, presence: newVal } : st
                      )
                    );
                  }}
                  setItems={() => {}}
                  style={[
                    styles.dropdown,
                    item.presence === 'P'
                      ? { backgroundColor: '#d4edda', borderColor: '#28a745' }
                      : item.presence === 'F'
                      ? { backgroundColor: '#f8d7da', borderColor: '#dc3545' }
                      : { backgroundColor: '#fff3cd', borderColor: '#fd7e14' },
                  ]}
                  dropDownContainerStyle={[
                    styles.dropdownMenu,
                    { zIndex: lineZ, elevation: lineZ },
                  ]}
                  zIndex={lineZ}
                  //zIndexInverse={false}
                  listMode="SCROLLVIEW"
                />
              </View>
            </View>
          );
        }}
      />


      {/* botão */}
      
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[styles.footerBtn, isSaving && { opacity: 0.5 }]}
          onPress={handleRegistrar}
          disabled={isSaving}
        >
          <Text style={styles.footerBtnText}>
            {isSaving ? 'Salvando...' : 'Registrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtn, styles.atualizarBtn]}
          onPress={async () => {
            setIsUpdating(true);
            await AsyncStorage.removeItem('turmas_cache');
            await carregarTurmas(true);
            setIsUpdating(false);
            Toast.show({
              type: 'success',
              text1: 'Cache limpo e turmas atualizadas!',
              position: 'top',
            });
          }}
        >
          <Text style={styles.footerBtnText}>
            {isUpdating ? 'Atualizando...' : '🔄 Atualizar'}
          </Text>

        </TouchableOpacity>
      </View>

      {isSaving && (
        <Modal transparent={true} animationType="fade">
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#003B73" />
              <Text style={styles.loadingText}>Salvando...</Text>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
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
  anoTurmaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    zIndex: 4000,
  },

  /* linha */
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  studentName: {
    flex: 1,
    fontSize: 16,
    color: '#003B73',
    marginRight: 8,
  },

  /* contêiner fixo */
  dropdownWrapper: {
    width: 90,
  },
  dropdown: {
    borderColor: '#003B73',
    backgroundColor: '#fff',
  },
  dropdownMenu: {
    borderColor: '#003B73',
    backgroundColor: '#fff',
  },
  separator: { height: 8 },

  registrarBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
  },
  registrarBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerRow: {
  position: 'absolute',
  bottom: 20,
  left: 20,
  right: 20,
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 10, // ou use marginRight no primeiro botão se necessário
},

footerBtn: {
  flex: 1,
  backgroundColor: '#003B73',
  paddingVertical: 12,
  borderRadius: 12,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
},

atualizarBtn: {
  backgroundColor: '#28593F',
  marginLeft: 10,
},

footerBtnText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
},
  
loadingOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  fontSize: 16,
  fontWeight: 'bold',
  color: '#003B73',
},
});
